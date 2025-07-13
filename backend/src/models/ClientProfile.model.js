import mongoose from "mongoose";

const clientSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    companyName: String,
    industry: String,
    primaryLocation: String,
    contactNumber: String,
    acceptedTerms: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const ClientProfile = mongoose.model("ClientProfile", clientSchema);
