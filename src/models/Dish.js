import mongoose from "mongoose";

export const CATEGORIAS = ["entrada", "plato fuerte", "postre", "bebida"];
export const ALERGENOS = ["gluten", "lacteos", "huevo", "mani", "mariscos", "soya", "pescado"];

const dishSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "El nombre del plato es obligatorio"],
      trim: true,
      minlength: [3, "El nombre debe tener al menos 3 caracteres"],
      maxlength: [80, "El nombre no puede superar 80 caracteres"],
      match: [/^[\p{L}0-9 .,'\-()]+$/u, "El nombre contiene caracteres no permitidos"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [300, "La descripción no puede superar 300 caracteres"],
    },
    category: {
      type: String,
      required: [true, "La categoría es obligatoria"],
      enum: {
        values: CATEGORIAS,
        message: "La categoría '{VALUE}' no es válida (entrada, plato fuerte, postre o bebida)",
      },
    },
    price: {
      type: Number,
      required: [true, "El precio es obligatorio"],
      min: [0.5, "El precio mínimo es $0.50"],
      max: [500, "El precio máximo es $500"],
      // Validación propia: máximo 2 decimales (el total debe ser exacto)
      validate: {
        validator: (v) => Math.abs(v * 100 - Math.round(v * 100)) < 1e-6,
        message: "El precio debe tener como máximo 2 decimales",
      },
    },
    // ARREGLO embebido: pocos elementos, se lee siempre junto al plato
    ingredients: {
      type: [String],
      // Validación propia sobre el arreglo
      validate: {
        validator: (arr) => arr.length >= 1 && new Set(arr).size === arr.length,
        message: "Debe indicar al menos un ingrediente y sin repetidos",
      },
    },
    allergens: [
      {
        type: String,
        enum: {
          values: ALERGENOS,
          message: "El alérgeno '{VALUE}' no es válido",
        },
      },
    ],
    prepMinutes: {
      type: Number,
      default: 15,
      min: [1, "El tiempo de preparación mínimo es 1 minuto"],
      max: [180, "El tiempo de preparación máximo es 180 minutos"],
    },
    available: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform: (doc, ret) => {
        delete ret.id; // el virtual "id" duplica a _id
        return ret;
      },
    },
  }
);

// VIRTUAL: no se guarda en MongoDB, se calcula al leer
dishSchema.virtual("priceLabel").get(function () {
  return typeof this.price === "number" ? `$${this.price.toFixed(2)}` : undefined;
});

// MIDDLEWARE pre("validate"): normaliza antes de validar. Sin next (función sync).
dishSchema.pre("validate", function () {
  if (typeof this.name === "string") this.name = this.name.replace(/\s+/g, " ").trim();
  if (Array.isArray(this.ingredients)) {
    this.ingredients = this.ingredients.map((i) => String(i).trim().toLowerCase()).filter(Boolean);
  }
  if (Array.isArray(this.allergens)) {
    this.allergens = this.allergens.map((a) => String(a).trim().toLowerCase());
  }
});

// Índice para el menú: filtrar por categoría y ordenar por nombre
dishSchema.index({ category: 1, name: 1 });

export default mongoose.model("Dish", dishSchema);
