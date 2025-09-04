// backend/src/routes/contactAccess.routes.js
import { Router } from "express";
import mongoose from "mongoose";
import {
  createContactPaymentIntent,
  confirmContactPayment,
  sendContactEmail,
  getContactAccessData,
} from "../controllers/ContactAccess.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";
import { isAdmin } from "../middlewares/isAdmin.js";
import {ContactAccess} from "../models/ContactAccess.model.js";

const router = Router();

// ================== Payment Routes ==================
// router.post("/payments/create-intent", verifyJWT, createContactPaymentIntent);
router.post(
  "/contact-access/create-contact-payment-intent",
  verifyJWT,
  createContactPaymentIntent
);
router.post("/contact-access/confirm-contact-payment", verifyJWT, confirmContactPayment);
router.post(
  "/contact-access/send-contact-email",
  verifyJWT,
  sendContactEmail
);

// ================== Admin Routes ==================
router.get("/admin/contact-access", verifyJWT, isAdmin, getContactAccessData);

// ================== User Routes ==================
router.get("/users/my-access-history", verifyJWT, async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const accessHistory = await ContactAccess.find({ userId })
      .populate("providerId", "companyName companyLocation")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalCount = await ContactAccess.countDocuments({ userId });
    const totalPages = Math.ceil(totalCount / limit);

    res.status(200).json({
      success: true,
      data: {
        accessHistory,
        totalPages,
        currentPage: parseInt(page),
      },
    });
  } catch (error) {
    console.error("Get access history error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch access history",
    });
  }
});

// ================== Provider Routes ==================
router.get("/providers/access-log", verifyJWT, async (req, res) => {
  try {
    const providerId = req.user.id;
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const accessLog = await ContactAccess.find({ providerId })
      .populate("userId", "fullName name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalCount = await ContactAccess.countDocuments({ providerId });
    const totalPages = Math.ceil(totalCount / limit);

    const revenueStats = await ContactAccess.aggregate([
      {
        $match: {
          providerId: new mongoose.Types.ObjectId(providerId),
          paymentStatus: "succeeded",
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$amountPaid" },
          totalAccesses: { $sum: 1 },
          uniqueUsers: { $addToSet: "$userId" },
        },
      },
      {
        $project: {
          totalRevenue: 1,
          totalAccesses: 1,
          uniqueUsers: { $size: "$uniqueUsers" },
        },
      },
    ]);

    const stats = revenueStats[0] || {
      totalRevenue: 0,
      totalAccesses: 0,
      uniqueUsers: 0,
    };

    res.status(200).json({
      success: true,
      data: {
        accessLog,
        totalPages,
        currentPage: parseInt(page),
        stats,
      },
    });
  } catch (error) {
    console.error("Get provider access log error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch access log",
    });
  }
});

export default router;
