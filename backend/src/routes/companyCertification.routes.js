import { Router } from "express";
import {
  createCompanyCertificate,
  getMyCompanyCertificates,
  deleteCompanyCertificate,
  editCompanyCertificate
} from "../controllers/CompanyCertification.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.post(
  "/",
  verifyJWT,
  upload.single("certificate"),
  createCompanyCertificate
);
router.get("/", verifyJWT, getMyCompanyCertificates);
router.delete("/:id", verifyJWT, deleteCompanyCertificate);
router.put(
  "/:id",
  verifyJWT,
  upload.single("certificate"),
  editCompanyCertificate
);


export default router;
