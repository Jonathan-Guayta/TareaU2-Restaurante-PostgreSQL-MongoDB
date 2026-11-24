import { Router } from "express";
import { auth } from "../middlewares/auth.js";
import * as c from "../controllers/order.controller.js";

const router = Router();
router.post("/", auth, c.create);
router.get("/mine", auth, c.mine); // consulta unida
router.patch("/:id/status", auth, c.setStatus);
router.delete("/:id", auth, c.remove);
export default router;
