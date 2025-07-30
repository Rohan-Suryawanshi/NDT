import mongoose from "mongoose";

const skillMatrixSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  technician: {
    name: { type: String, required: true },
  },  certificates: [
    {
      method: { type: String, required: true },
      level: { 
        type: String, 
        required: true,
        enum: ["assistant", "level_1", "level_2", "level_3", "engineer"]
      },
      certificationExpiryDate: { type: Date, required: true },
      certificationUrl: { type: String, required: true },
      experience: { type: String, default: "" },
      qualification: { type: String, default: "" },
      isAvailable: { type: Boolean, default: true },
    },
  ],
  updatedAt: { type: Date, default: Date.now },
});

export const SkillMatrix = mongoose.model("SkillMatrix", skillMatrixSchema);
