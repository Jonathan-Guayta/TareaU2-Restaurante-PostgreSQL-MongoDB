import { AppError } from "../utils/AppError.js";

// Traduce cualquier error a una respuesta JSON con el código correcto
export function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    return res.status(err.status).json({ message: err.message });
  }
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ message: "Datos inválidos", errors });
  }
  if (err.name === "CastError") {
    return res.status(400).json({ message: `Valor inválido para '${err.path}'` });
  }
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ message: "El cuerpo no es un JSON válido" });
  }
  // E11000: índice único de MongoDB (p. ej. una calificación por pedido)
  if (err.code === 11000) {
    return res.status(409).json({ message: "Ya existe un registro con ese valor único" });
  }
  // Prisma: P2002 único, P2003 clave foránea
  if (err.code === "P2002") {
    return res.status(409).json({ message: "Ya existe un registro con ese valor único" });
  }
  if (err.code === "P2003") {
    return res.status(409).json({ message: "Existen registros que dependen de este" });
  }
  console.error(err);
  res.status(500).json({ message: "Error interno del servidor" });
}
