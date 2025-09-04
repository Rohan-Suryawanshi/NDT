import express from "express";
import {
  upsertProfile,
  getMyProfile,
  deleteMyProfile,
  getAllProfiles,
  getProfileByUserId,
  verifyOtpAndUpsertProfile,
} from "../controllers/ServiceProvider.controller.js";
 // assuming multer setup
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = express.Router();

// Upload fields config (adjust field names if different)
const uploadFields = upload.fields([
  { name: "companyLogo", maxCount: 1 },
  { name: "proceduresFile", maxCount: 1 },
]);

router.post("/profile", verifyJWT,uploadFields, upsertProfile);
// router.post("/profile", verifyJWT,uploadFields, verifyOtpAndUpsertProfile);

router.get("/profile", verifyJWT, getMyProfile);
router.get("/profile/:userId", getProfileByUserId); // Get profile by user ID
router.delete("/profile", verifyJWT, deleteMyProfile);
router.get("/all", getAllProfiles); // Public or admin

export default router;
