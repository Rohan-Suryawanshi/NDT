import mongoose from "mongoose";

const chatSchema = new mongoose.Schema(
  {
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: "JobRequest" },
    from: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    to: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    message: String,
    flagged: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const ChatMessage = mongoose.model("ChatMessage", chatSchema);
