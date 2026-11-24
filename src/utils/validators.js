import mongoose from "mongoose";
import { AppError } from "./AppError.js";

// ObjectId de 24 caracteres hex (isValidObjectId solo también acepta 12 chars)
export function isObjectId(value) {
  return (
    typeof value === "string" &&
    mongoose.isValidObjectId(value) &&
    /^[0-9a-fA-F]{24}$/.test(value)
  );
}

// Id numérico de PostgreSQL (Int > 0)
export function parseId(value, label = "id") {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1 || n > 2147483647) {
    throw new AppError(400, `El ${label} debe ser un entero positivo`);
  }
  return n;
}

export function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
