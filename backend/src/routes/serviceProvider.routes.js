import { Router } from "express";
import {
  upsertServiceProvider,
  getServiceProviderProfile,
  getAllServiceProviders,
} from "../controllers/ServiceProvider.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.post(
  "/profile",
  verifyJWT,
  upload.fields([
    { name: "twicCertificate", maxCount: 1 },
    { name: "gatePassCertificate", maxCount: 1 },
    { name: "personnelCertificate", maxCount: 1 },
    { name: "companyLogo", maxCount: 1 },
  ]),
  upsertServiceProvider
);

router.get("/profile", verifyJWT, getServiceProviderProfile);
router.get("/all",verifyJWT,getAllServiceProviders);

export default router;
