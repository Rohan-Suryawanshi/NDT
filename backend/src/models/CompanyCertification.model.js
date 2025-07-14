import mongoose from "mongoose";

const companyCertificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    certificateName: { type: String, required: true },
    certificationBody: { type: String, required: true },
    category: { type: String },
    issuedYear: { type: String, required: true },
    expiryDate: { type: Date, required: true },
    certificateUrl: { type: String, required: true }, // Cloudinary URL
  },
  { timestamps: true }
);

export const CompanyCertification = mongoose.model(
  "CompanyCertification",
  companyCertificationSchema
);
