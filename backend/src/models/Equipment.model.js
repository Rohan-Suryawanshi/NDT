import mongoose from "mongoose";

const equipmentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    method: { type: String, required: true }, // e.g., UT, RT
    manufacturer: { type: String, required: true },
    model: { type: String },
    serialNumber: { type: String, required: true },
    calibrationExpiry: { type: Date, required: true },
  },
  { timestamps: true }
);

export const Equipment = mongoose.model("Equipment", equipmentSchema);
