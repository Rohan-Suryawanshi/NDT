import { Router } from "express";
import {
  upsertClientProfile,
  getClientProfile,
  getAllClientProfiles,
  deleteClientProfile,
} from "../controllers/ClientProfile.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { isAdmin } from "../middlewares/isAdmin.js";

const router = Router();

// User routes
router.post("/profile", verifyJWT, upsertClientProfile);
router.get("/profile", verifyJWT, getClientProfile);

// Admin routes
router.get("/all", verifyJWT, getAllClientProfiles);
router.delete("/profile/:userId", verifyJWT, isAdmin, deleteClientProfile);

export default router;
