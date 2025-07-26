import { Router } from "express";
import {
  createJobRequest,
  getAllJobRequests,
  getJobRequestById,
  updateJobRequest,
  deleteJobRequest,
  updateJobStatus,
  addQuotation,
  getQuotationHistory,
  addInternalNote,
  addAttachment,
  getJobRequestStats,
  getJobsByProvider,
  getJobsByClient,
} from "../controllers/JobRequest.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

// All routes require authentication
router.use(verifyJWT);

// Main job request CRUD operations
router.post("/", createJobRequest);
router.get("/", getAllJobRequests);
router.get("/stats", getJobRequestStats); // Must come before /:id to avoid conflicts
router.get("/:id", getJobRequestById);
router.put("/:id", updateJobRequest);
router.delete("/:id", deleteJobRequest);

// Job status management
router.patch("/:id/status", updateJobStatus);

// Quotation management
router.post("/:id/quotations", addQuotation);
router.get("/:id/quotations", getQuotationHistory);

// Notes and attachments
router.post("/:id/notes", addInternalNote);
router.post("/:id/attachments", upload.single("attachment"), addAttachment);

// Dashboard specific routes
router.get("/provider/:providerId", getJobsByProvider);
router.get("/client/:clientId", getJobsByClient);

export default router;
