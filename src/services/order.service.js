import prisma from "../db/prisma.js";
import Dish from "../models/Dish.js";
import Review from "../models/Review.js";
import { AppError } from "../utils/AppError.js";
import { isObjectId, parseId } from "../utils/validators.js";

const TIPOS = ["MESA", "DOMICILIO"];
const ESTADOS = ["PENDIENTE", "EN_PREPARACION", "ENTREGADO", "CANCELADO"];

// Dinero exacto: se calcula en centavos enteros, nunca con decimales flotantes
const money = (cents) => (cents / 100).toFixed(2);
const serialize = (o) => ({ ...o, unitPrice: Number(o.unitPrice), total: Number(o.total) });

// CREAR EN POSTGRESQL VALIDANDO MONGODB
export async function createOrder(userId, body) {
  const { dishId, quantity = 1, type, tableNumber, address } = body;

  if (!TIPOS.includes(type)) throw new AppError(400, "El tipo debe ser MESA o DOMICILIO");
  const qty = Number(quantity);
  if (!Number.isInteger(qty) || qty < 1 || qty > 20) {
    throw new AppError(400, "La cantidad debe ser un entero entre 1 y 20");
  }
  if (type === "MESA" && !(Number.isInteger(tableNumber) && tableNumber >= 1)) {
    throw new AppError(400, "Para MESA indique tableNumber (entero ≥ 1)");
  }
  if (type === "DOMICILIO" && !(typeof address === "string" && address.trim().length >= 5)) {
    throw new AppError(400, "Para DOMICILIO indique address (mínimo 5 caracteres)");
  }

  // 1) ¿El _id de MongoDB tiene forma válida y el plato existe?
  if (!isObjectId(dishId)) throw new AppError(400, "El dishId no es un ObjectId válido");
  const dish = await Dish.findById(dishId).select("name price available").lean();
  if (!dish) throw new AppError(404, "El plato no existe en el catálogo");
  if (!dish.available) throw new AppError(409, "El plato no está disponible");

  // 2) Recién ahora se escribe en PostgreSQL (si Mongo falla antes, no se escribió nada)
  const unitCents = Math.round(dish.price * 100);
  const order = await prisma.order.create({
    data: {
      userId, // sale del JWT
      dishId: String(dish._id),
      type,
      tableNumber: type === "MESA" ? tableNumber : null,
      address: type === "DOMICILIO" ? address.trim() : null,
      quantity: qty,
      unitPrice: money(unitCents), // copia del precio vigente
      total: money(unitCents * qty),
    },
  });
  return serialize(order);
}

// CONSULTA UNIDA: PostgreSQL + MongoDB con $in + Map (sin N+1)
export async function listMyOrders(userId) {
  const orders = await prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  // Una sola consulta a MongoDB para todos los platos
  const ids = [...new Set(orders.map((o) => o.dishId).filter(isObjectId))];
  const dishes = await Dish.find({ _id: { $in: ids } })
    .select("name category ingredients allergens")
    .lean();
  const byId = new Map(dishes.map((d) => [String(d._id), d]));

  return orders.map((o) => ({ ...serialize(o), dish: byId.get(o.dishId) ?? null }));
}

async function getOwnedOrder(userId, rawId) {
  const id = parseId(rawId, "id del pedido");
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) throw new AppError(404, "Pedido no encontrado");
  if (order.userId !== userId) throw new AppError(403, "El pedido no pertenece a este usuario");
  return order;
}

export async function updateStatus(userId, rawId, status) {
  const order = await getOwnedOrder(userId, rawId);
  if (!ESTADOS.includes(status)) {
    throw new AppError(400, `El estado debe ser uno de: ${ESTADOS.join(", ")}`);
  }
  const updated = await prisma.order.update({ where: { id: order.id }, data: { status } });
  return serialize(updated);
}

// Borra el pedido y, en cascada, su calificación en MongoDB
export async function removeOrder(userId, rawId) {
  const order = await getOwnedOrder(userId, rawId);
  await Review.deleteMany({ orderId: order.id });
  await prisma.order.delete({ where: { id: order.id } });
}
