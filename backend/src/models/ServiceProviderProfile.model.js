import mongoose from "mongoose";

const providerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    contactNumber: { type: String, trim: true },
    companyName: { type: String, trim: true },
    companyLocation: { type: String, trim: true },
    companyDescription: { type: String, trim: true },
    companySpecialization: { type: [String] },
    businessLocation: { type: String, trim: true },
    companyLogoUrl: { type: String }, // Cloudinary URL
    proceduresUrl: { type: String },

    // Certificate Uploads & Expiry Dates
    certificates: {
      twic: {
        fileUrl: { type: String }, // Cloudinary URL
        expiryDate: { type: Date },
      },
      gatePass: {
        fileUrl: { type: String },
        expiryDate: { type: Date },
      },
    },

    // Services Offered
    services: [
      {
        serviceId: { type: mongoose.Schema.Types.ObjectId, ref: "Service" },
        unit: String,
        quantity: Number,
        currency: String,
        price: Number,
        tax: Number,
      },
    ],

    // Skills
    skillMatrix: [
      {
        skill: { type: String },
        level: { type: Number, min: 1, max: 3 }, // 1: Beginner, 2: Intermediate, 3: Expert
      },
    ],

    // Qualifications & Certifications
    personnelQualifications: [
      {
        certificationBody: String,
        level: String,
        certificateUrl: String,
      },
    ],
    companyCertifications: [
      {
        certificateName: String,
        certificateUrl: String,
      },
    ], // List of ISO/NDT certifications, etc.

    acceptedTerms: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const ServiceProviderProfile = mongoose.model(
  "ServiceProviderProfile",
  providerSchema
);
