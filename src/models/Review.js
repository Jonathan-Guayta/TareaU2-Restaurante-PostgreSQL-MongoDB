import mongoose from "mongoose";

// Registro que crece sin límite: colección propia (no embebida en Dish)
const reviewSchema = new mongoose.Schema(
  {
    // → PostgreSQL orders.id (sin FK). Una calificación por pedido (índice único abajo)
    orderId: {
      type: Number,
      required: [true, "El pedido es obligatorio"],
      min: [1, "El pedido debe ser un número positivo"],
    },
    // → PostgreSQL users.id (sale del JWT, nunca del body)
    userId: { type: Number, required: [true, "El usuario es obligatorio"] },
    // COPIA de users.name (desnormalización): evita consultar PostgreSQL al listar
    customerName: { type: String, required: true, trim: true },
    // Referencia dentro de MongoDB (ObjectId + ref → populate)
    dish: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Dish",
      required: [true, "El plato es obligatorio"],
    },
    rating: {
      type: Number,
      required: [true, "La calificación es obligatoria"],
      min: [1, "La calificación mínima es 1"],
      max: [5, "La calificación máxima es 5"],
      validate: {
        validator: Number.isInteger,
        message: "La calificación debe ser un número entero",
      },
    },
    comment: {
      type: String,
      trim: true,
      maxlength: [500, "El comentario no puede superar 500 caracteres"],
    },
  },
  { timestamps: true, versionKey: false }
);

// Único: una calificación por pedido → duplicado = E11000 → 409
reviewSchema.index({ orderId: 1 }, { unique: true });
// Lista de calificaciones de un plato, las más nuevas primero
reviewSchema.index({ dish: 1, createdAt: -1 });

export default mongoose.model("Review", reviewSchema);
