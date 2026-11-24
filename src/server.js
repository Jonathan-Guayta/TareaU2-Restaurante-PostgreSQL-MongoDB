import "dotenv/config";
import app from "./app.js";
import prisma from "./db/prisma.js";
import { connectMongo } from "./db/mongo.js";

const PORT = process.env.PORT || 3000;

// El servidor arranca SOLO si las dos bases conectan
async function start() {
  try {
    await connectMongo();
    await prisma.$connect();
    console.log("✔ PostgreSQL conectado");
    app.listen(PORT, () => console.log(`✔ API en http://localhost:${PORT}/api`));
  } catch (err) {
    console.error("✖ No se pudo iniciar:", err.message);
    process.exit(1);
  }
}

start();
