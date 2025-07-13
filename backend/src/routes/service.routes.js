import { Router } from "express";
import {
  createService,
  getAllServices,
  getServiceById,
  updateService,
  deleteService,
} from "../controllers/Service.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Optionally protect routes with verifyJWT
router.post("/", verifyJWT, createService);
router.get("/", getAllServices);
router.get("/:id", getServiceById);
router.put("/:id", verifyJWT, updateService);
router.delete("/:id", verifyJWT, deleteService);

export default router;
