import jwt from "jsonwebtoken";
import { AppError } from "../utils/AppError.js";

// Protege las escrituras con el JWT emitido por el login (PostgreSQL)
export function auth(req, res, next) {
  const [scheme, token] = (req.headers.authorization || "").split(" ");
  if (scheme !== "Bearer" || !token) {
    throw new AppError(401, "Token requerido: Authorization: Bearer <token>");
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: Number(payload.sub), email: payload.email };
    next();
  } catch {
    throw new AppError(401, "Token inválido o expirado");
  }
}
