import express from "express";
import {
  addServiceOffered,
  getMyServices,
  deleteServiceOffered,
} from "../controllers/ServiceOffered.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/", verifyJWT, addServiceOffered);
router.get("/", verifyJWT, getMyServices);
router.delete("/:id", verifyJWT, deleteServiceOffered);

export default router;
