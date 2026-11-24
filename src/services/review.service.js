import mongoose from "mongoose";
import prisma from "../db/prisma.js";
import Review from "../models/Review.js";
import { AppError } from "../utils/AppError.js";
import { isObjectId, parseId } from "../utils/validators.js";

// CREAR EN MONGODB VALIDANDO POSTGRESQL
export async function createReview(userId, body) {
  const { orderId, rating, comment } = body;
  const id = parseId(orderId, "orderId");

  // 1) El pedido existe en PostgreSQL (404) y es del usuario del token (403)
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) throw new AppError(404, "El pedido no existe");
  if (order.userId !== userId) throw new AppError(403, "El pedido no pertenece a este usuario");
  if (order.status !== "ENTREGADO") {
    throw new AppError(400, "Solo se puede calificar un pedido ya entregado");
  }
  if (!order.dishId) throw new AppError(400, "El pedido no tiene un plato asociado");

  // 2) Dato copiado de PostgreSQL: el nombre del cliente
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
  if (!user) throw new AppError(401, "El usuario del token ya no existe");

  // 3) Se escribe en MongoDB; el índice único responde E11000 → 409 si ya calificó
  return Review.create({
    orderId: order.id,
    userId, // del JWT, no del body
    customerName: user.name,
    dish: order.dishId,
    rating,
    comment,
  });
}

// LISTA con populate + orden + aggregate (promedio y conteo)
export async function listReviews({ dishId, limit }) {
  if (dishId !== undefined && !isObjectId(dishId)) {
    throw new AppError(400, "El dishId no es un ObjectId válido");
  }
  const filter = dishId ? { dish: dishId } : {};
  const max = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

  const [data, stats] = await Promise.all([
    Review.find(filter)
      .sort({ createdAt: -1 }) // más nuevas primero (usa el índice dish+createdAt)
      .limit(max)
      .populate("dish", "name category"),
    Review.aggregate([
      // aggregate NO castea: hay que convertir a ObjectId a mano
      { $match: dishId ? { dish: new mongoose.Types.ObjectId(dishId) } : {} },
      { $group: { _id: null, average: { $avg: "$rating" }, total: { $sum: 1 } } },
    ]),
  ]);

  const s = stats[0];
  return {
    summary: { average: s ? Math.round(s.average * 100) / 100 : null, total: s ? s.total : 0 },
    data,
  };
}
