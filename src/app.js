import express from "express";
import authRoutes from "./routes/auth.routes.js";
import dishRoutes from "./routes/dish.routes.js";
import orderRoutes from "./routes/order.routes.js";
import reviewRoutes from "./routes/review.routes.js";
import { errorHandler } from "./middlewares/errorHandler.js";

const app = express();
app.use(express.json());
app.use((req, res, next) => {
  req.body ??= {}; // Express 5: sin JSON, req.body llega undefined
  next();
});

app.get("/api/health", (req, res) => res.json({ status: "ok" }));
app.use("/api/auth", authRoutes);
app.use("/api/dishes", dishRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/reviews", reviewRoutes);

app.use((req, res) => res.status(404).json({ message: "Ruta no encontrada" }));
app.use(errorHandler);

export default app;
