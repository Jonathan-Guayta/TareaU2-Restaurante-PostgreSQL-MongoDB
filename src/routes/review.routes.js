import { Router } from "express";
import { auth } from "../middlewares/auth.js";
import * as c from "../controllers/review.controller.js";

const router = Router();
router.get("/", c.list); // público
router.post("/", auth, c.create);
export default router;
