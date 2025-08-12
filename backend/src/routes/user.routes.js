import { Router } from "express";
import {
  registerUser,
  verifyEmail,
  loginUser,
  refreshAccessToken,
  logoutUser,
  changeCurrentUserPassword,
  getCurrentUser,
  updateAvatarImage,
  getAllUsers,
  updateUserByAdmin,
  deleteUserByAdmin,
  getUserStats,
} from "../controllers/User.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { isAdmin } from "../middlewares/isAdmin.js";

const router = Router();

router.post("/register",upload.single("avatar"),registerUser);

router.get("/verify-email", verifyEmail);
router.post("/login", loginUser);
router.post("/refresh-token", refreshAccessToken);

// Auth routes
router.post("/logout", verifyJWT, logoutUser);
router.get("/current-user", verifyJWT, getCurrentUser);
router.put("/change-password", verifyJWT, changeCurrentUserPassword);
router.put("/avatar", verifyJWT, upload.single("avatar"), updateAvatarImage);

// Admin routes
router.get("/admin/all", verifyJWT, isAdmin, getAllUsers);
router.get("/admin/stats", verifyJWT, isAdmin, getUserStats);
router.put("/admin/:userId", verifyJWT, isAdmin, updateUserByAdmin);
router.delete("/admin/:userId", verifyJWT, isAdmin, deleteUserByAdmin);

export default router;
