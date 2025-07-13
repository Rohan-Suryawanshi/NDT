import { Router } from "express";
import {
  upsertInspectorProfile,
  getInspectorProfile,
  getAllInspectors,
} from "../controllers/Inspector.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/profile", verifyJWT, upsertInspectorProfile);
router.get("/profile", verifyJWT, getInspectorProfile);
router.get("/all", verifyJWT, getAllInspectors); // Optional: Add admin check

export default router;
