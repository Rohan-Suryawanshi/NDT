import mongoose from "mongoose";

const invoiceSchema = new mongoose.Schema(
  {
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: "JobRequest" },
    providerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    amount: Number,
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    templateUsed: String,
    pdfUrl: String,
  },
  { timestamps: true }
);

export const Invoice = mongoose.model("Invoice", invoiceSchema);
