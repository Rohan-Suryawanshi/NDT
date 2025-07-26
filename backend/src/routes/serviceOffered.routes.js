import express from "express";
import {
  addServiceOffered,
  getMyServices,
  deleteServiceOffered,
  getServiceOfferByProviderId,
} from "../controllers/ServiceOffered.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/", verifyJWT, addServiceOffered);
router.get("/", verifyJWT, getMyServices);
router.get("/provider/:providerId", verifyJWT, getServiceOfferByProviderId);
router.delete("/:id", verifyJWT, deleteServiceOffered);

export default router;
