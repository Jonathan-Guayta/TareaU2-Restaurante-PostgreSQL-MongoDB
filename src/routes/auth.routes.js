import { Router } from "express";
import { auth } from "../middlewares/auth.js";
import * as c from "../controllers/auth.controller.js";

const router = Router();
router.post("/register", c.register);
router.post("/login", c.login);
router.delete("/me", auth, c.removeMe);
export default router;
