import mongoose from "mongoose";

// Conexión a MongoDB (una sola por base). El servidor arranca solo si conecta.
export async function connectMongo() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("Falta MONGODB_URI en el archivo .env");
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
  console.log("✔ MongoDB conectado");
}

export default mongoose;
