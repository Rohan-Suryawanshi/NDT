import mongoose from "mongoose";

const procedureSchema = new mongoose.Schema(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "JobRequest",
      required: true,
    },
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: { type: String, enum: ["pending", "approved"], default: "pending" },

    approvedByProvider: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    approvedByClient: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    procedureNumber: { type: String, required: true }, // ✅ Procedure No.
    revisionNumber: { type: String, required: true }, // ✅ Revision No.
    approvedDate: { type: Date }, // ✅ Approval Date

    templateUsed: String,
    pdfUrl: String,
  },
  { timestamps: true }
);

export const ProcedureDocument = mongoose.model(
  "ProcedureDocument",
  procedureSchema
);
