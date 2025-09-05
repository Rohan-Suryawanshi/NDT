import mongoose from "mongoose";

const serviceProviderProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    contactNumber: { type: String, required: true },
    companyName: { type: String, required: true },
    companyLocation: { type: String, required: true },
    companyDescription: { type: String, required: true },
    companySpecialization: [{ type: String }],
    companyLogoUrl: { type: String },
    proceduresUrl: { type: String },
    rating: { type: Number, default: 0 },
    totalRatings: { type: Number, default: 0 },
    ratingSum: { type: Number, default: 0 },
    companyLat: {
      type: Number,
      required: false,
      min: -90,
      max: 90,
    },
    companyLng: {
      type: Number,
      required: false,
      min: -180,
      max: 180,
    },
  },
  { timestamps: true }
);

export const ServiceProviderProfile = mongoose.model(
  "ServiceProviderProfile",
  serviceProviderProfileSchema
);
