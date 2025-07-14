import express from "express";
import {
  createSkillMatrix,
  getMySkillMatrices,
  getSkillMatrixById,
  updateSkillMatrix,
  deleteSkillMatrix,
} from "../controllers/SkillMatrix.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = express.Router();

router.use(verifyJWT);

router.post(
  "/",
  upload.fields([{ name: "certificateFiles", maxCount: 10 }]),
  createSkillMatrix
);
router.get("/", getMySkillMatrices);
router.get("/:id", getSkillMatrixById);
router.put(
  "/:id",
  upload.fields([{ name: "certificateFiles", maxCount: 10 }]),
  updateSkillMatrix
);
router.delete("/:id", deleteSkillMatrix);

export default router;
