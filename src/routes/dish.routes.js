import { Router } from "express";
import { auth } from "../middlewares/auth.js";
import * as c from "../controllers/dish.controller.js";

const router = Router();
router.get("/", c.list); // público
router.get("/:id", c.getOne); // público
router.post("/", auth, c.create); // escrituras con JWT
router.put("/:id", auth, c.update);
router.delete("/:id", auth, c.remove);
export default router;
