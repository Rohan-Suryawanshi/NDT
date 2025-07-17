import mongoose from "mongoose";

const serviceOfferedSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: true,
    },
    charge: { type: Number, required: true },
    unit: { type: String, required: true }, // e.g., "Per Day", "Per Inspection"
    currency: { type: String, default: "USD" }, // USD, INR, etc.
    tax: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const ServiceOffered = mongoose.model(
  "ServiceOffered",
  serviceOfferedSchema
);
