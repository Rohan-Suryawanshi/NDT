import mongoose from "mongoose";

const { Schema } = mongoose;

// Reusable schema for certifications
const CertificationSchema = new Schema(
  {
    certificationBody: { type: String, required: true },
    level: { type: String, required: true },
    certificateImage: { type: String },
    expiryDate: { type: Date, required: true }, // For expiry alert feature
  },
  { timestamps: true }
);

// Job history schema
const JobHistorySchema = new Schema(
  {
    jobId: { type: Schema.Types.ObjectId, ref: "Job" },
    clientId: { type: Schema.Types.ObjectId, ref: "User" },
    date: Date,
    status: { type: String, enum: ["Completed", "Ongoing", "Cancelled"] },
    rating: Number,
    feedback: String,
  },
  { timestamps: true }
);

// Resume upload schema
const ResumeSchema = new Schema({
  url: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now },
});

// Stripe payout schema
const PayoutSchema = new Schema(
  {
    amount: Number,
    status: {
      type: String,
      enum: ["Pending", "Approved", "Declined"],
      default: "Pending",
    },
    requestedAt: { type: Date, default: Date.now },
    stripePayoutId: { type: String }, // From Stripe
  },
  { timestamps: true }
);

const InspectorProfileSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    fullName: { type: String, required: true },
    contactNumber: { type: String, required: true },

    associationType: {
      type: String,
      enum: ["Freelancer", "Company Employee"],
      required: true,
    },
    companyName: { type: String },

    certifications: [CertificationSchema],
    resume: ResumeSchema,

    hourlyRate: { type: Number },
    monthlyRate: { type: Number },
    marginRate: { type: Number, default: 0 }, // Admin controlled margin %

    availability: {
      type: Boolean,
      default: true,
    },
    verified: { type: Boolean, default: false },

    certificateExpiryAlerts: { type: Boolean, default: true },
    matchingJobEmailAlerts: { type: Boolean, default: true },

    payouts: [PayoutSchema],
    jobHistory: [JobHistorySchema],

    subscriptionPlan: {
      type: String,
      enum: ["Free", "Pro"],
      default: "Free",
    },

    rating: {
      type: Number,
      default: 0,
    },
    totalEarnings: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export const InspectorProfile = mongoose.model(
  "InspectorProfile",
  InspectorProfileSchema
);
