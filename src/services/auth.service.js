import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../db/prisma.js";
import { AppError } from "../utils/AppError.js";

export async function register({ email, password, name }) {
  if (typeof email !== "string" || !/^\S+@\S+\.\S+$/.test(email)) {
    throw new AppError(400, "Email inválido");
  }
  if (typeof password !== "string" || password.length < 6) {
    throw new AppError(400, "La contraseña debe tener al menos 6 caracteres");
  }
  if (typeof name !== "string" || name.trim().length < 2) {
    throw new AppError(400, "El nombre debe tener al menos 2 caracteres");
  }
  const exists = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (exists) throw new AppError(409, "Ya existe un usuario con ese email");

  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      name: name.trim(),
      password: await bcrypt.hash(password, 10),
    },
  });
  return { id: user.id, email: user.email, name: user.name };
}

export async function login({ email, password }) {
  const user =
    typeof email === "string"
      ? await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
      : null;
  const ok = user && typeof password === "string" && (await bcrypt.compare(password, user.password));
  if (!ok) throw new AppError(401, "Credenciales incorrectas");

  const token = jwt.sign({ sub: String(user.id), email: user.email }, process.env.JWT_SECRET, {
    expiresIn: "2h",
  });
  return { token, user: { id: user.id, email: user.email, name: user.name } };
}

export async function removeMe(userId) {
  // Si el usuario aún tiene pedidos, Prisma lanza P2003 → 409 (errorHandler)
  await prisma.user.delete({ where: { id: userId } });
}
