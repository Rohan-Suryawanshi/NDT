import mongoose from "mongoose";

const skillMatrixSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  technician: {
    name: { type: String, required: true },
  },
  certificates: [
    {
      method: { type: String, required: true },
      level: { type: String, required: true },
      certificationExpiryDate: { type: Date, required: true },
      certificationUrl: { type: String, required: true },
    },
  ],
  updatedAt: { type: Date, default: Date.now },
});

export const SkillMatrix = mongoose.model("SkillMatrix", skillMatrixSchema);
