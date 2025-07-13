import mongoose from "mongoose";
const serviceSchema = new mongoose.Schema({
  name: String,
  code: String,
  description: String,
  isPremium: { type: Boolean, default: false },
});

export const Service = mongoose.model("Service", serviceSchema);
