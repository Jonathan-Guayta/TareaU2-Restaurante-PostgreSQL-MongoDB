import { PrismaClient } from "@prisma/client";

// Conexión a PostgreSQL (una sola instancia para toda la app)
const prisma = new PrismaClient();

export default prisma;
