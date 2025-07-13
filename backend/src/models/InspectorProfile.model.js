import mongoose from "mongoose";

const inspectorSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    fullName: String,
    contactNumber: String,
    associationType: {
      type: String,
      enum: ["Freelancer", "Company Employee"],
      required: true,
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    certifications: [
      {
        certificationBody: String,
        level: String,
      },
    ],
    
    
    acceptedTerms: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const InspectorProfile = mongoose.model(
  "InspectorProfile",
  inspectorSchema
);
