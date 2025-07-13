import mongoose from "mongoose";

const jobRequestSchema = new mongoose.Schema(
  {
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    title: String,
    description: String,
    location: String,
    region: String,
    requiredServices: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Service" },
    ],
    isPremium: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["open", "in-progress", "completed"],
      default: "open",
    },

    assignedProviderId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    assignedInspectorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    quotationHistory: [
      {
        revision: Number,
        price: Number,
        notes: String,
        submittedOn: Date,
        acceptedOn: Boolean,
      },
    ],
  },
  { timestamps: true }
);

export const JobRequest = mongoose.model("JobRequest", jobRequestSchema);
