import prisma from "../db/prisma.js";
import Dish from "../models/Dish.js";
import Review from "../models/Review.js";
import { AppError } from "../utils/AppError.js";
import { isObjectId, escapeRegex } from "../utils/validators.js";

const FIELDS = ["name", "description", "category", "price", "ingredients", "allergens", "prepMinutes", "available"];
const SORTS = ["name", "price", "prepMinutes", "createdAt"];

// GET /dishes?q=&category=&fields=&sort=
export async function listDishes({ q, category, fields, sort }) {
  const filter = {};
  if (q) filter.name = { $regex: escapeRegex(String(q)), $options: "i" }; // regex (escapado)
  if (category) filter.category = String(category);

  // Proyección: solo los campos pedidos (lista blanca)
  const projection = fields
    ? String(fields).split(",").map((f) => f.trim()).filter((f) => FIELDS.includes(f)).join(" ")
    : "";

  // Orden: ?sort=price (asc) o ?sort=-price (desc); por defecto por nombre
  const desc = typeof sort === "string" && sort.startsWith("-");
  const key = typeof sort === "string" ? sort.replace(/^-/, "") : "name";
  const sortBy = { [SORTS.includes(key) ? key : "name"]: desc ? -1 : 1 };

  return Dish.find(filter, projection || null).sort(sortBy);
}

export async function getDish(id) {
  if (!isObjectId(id)) throw new AppError(400, "El id del plato no es válido");
  const dish = await Dish.findById(id);
  if (!dish) throw new AppError(404, "Plato no encontrado");
  return dish;
}

export async function createDish(body) {
  const data = {};
  for (const f of FIELDS) if (f in body) data[f] = body[f];
  return Dish.create(data); // ValidationError → 400 (errorHandler)
}

// PUT: findById + save() para que corran validaciones y pre("validate")
export async function updateDish(id, body) {
  const dish = await getDish(id);
  for (const f of FIELDS) if (f in body) dish[f] = body[f];
  await dish.save();
  return dish;
}

// DELETE protegido: 409 si PostgreSQL lo usa; si no, cascada en MongoDB
export async function deleteDish(id) {
  const dish = await getDish(id);
  const used = await prisma.order.count({ where: { dishId: String(dish._id) } });
  if (used > 0) {
    throw new AppError(409, `No se puede eliminar: ${used} pedido(s) usan este plato`);
  }
  await Review.deleteMany({ dish: dish._id }); // idempotente: se puede reintentar si falla después
  await dish.deleteOne();
}
