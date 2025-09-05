import { Router } from "express";
import {
  upsertInspectorProfile,
  getInspectorProfile,
  getAllInspectors,
  updateInspectorLocation,
  updateAvailability,
  updateRates,
  addCertification,
  removeCertification,
  updateResume,
  updateNotificationPreferences,
  getInspectorsWithExpiringCertificates,
  verifyInspector,
  deleteInspectorProfile,
  sendInspectorOTP,
  verifyInspectorOTP,
} from "../controllers/Inspector.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { isAdmin } from "../middlewares/isAdmin.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

// OTP routes
router.post("/send-otp", verifyJWT, sendInspectorOTP);
router.post("/verify-otp", verifyJWT, verifyInspectorOTP);

// Profile routes
router.post("/profile", verifyJWT, upload.single("resume"), upsertInspectorProfile);
router.get("/profile", verifyJWT, getInspectorProfile);
router.delete("/profile", verifyJWT, deleteInspectorProfile);

// Update specific fields
router.patch("/availability", verifyJWT, updateAvailability);
router.patch("/rates", verifyJWT, updateRates);
router.patch("/location", verifyJWT, updateInspectorLocation);
router.patch("/notifications", verifyJWT, updateNotificationPreferences);
router.patch("/resume", verifyJWT, upload.single("resume"), updateResume);

// Certification management
router.post(
  "/certifications",
  verifyJWT,
  upload.single("certificateImage"),
  addCertification
);
router.delete("/certifications/:certificationId", verifyJWT, removeCertification);

// Public/Admin routes
router.get("/all", getAllInspectors);

// Admin only routes
router.get("/expiring-certificates", verifyJWT, isAdmin, getInspectorsWithExpiringCertificates);
router.patch("/verify/:inspectorId", verifyJWT, isAdmin, verifyInspector);

export default router;
