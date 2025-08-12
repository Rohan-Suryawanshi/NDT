import mongoose from "mongoose";

const WithdrawalSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    withdrawalMethod: {
      type: String,
      enum: ["bank_transfer", "paypal", "stripe", "crypto"],
      required: true,
    },
    bankDetails: {
      accountNumber: String,
      routingNumber: String,
      bankName: String,
      accountHolderName: String,
      swiftCode: String,
    },
    paypalDetails: {
      email: String,
    },
    cryptoDetails: {
      walletAddress: String,
      currency: String,
    },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "rejected", "cancelled"],
      default: "pending",
    },
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    processedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    rejectedAt: {
      type: Date,
    },
    adminNotes: [{
      note: String,
      addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      addedAt: {
        type: Date,
        default: Date.now,
      },
    }],
    transactionId: {
      type: String, // External transaction ID from payment processor
    },
    processingFee: {
      type: Number,
      default: 0,
    },
    netAmount: {
      type: Number, // Amount after deducting processing fee
    },
    currency: {
      type: String,
      default: "USD",
    },
    metadata: {
      type: Object,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
WithdrawalSchema.index({ userId: 1, status: 1 });
WithdrawalSchema.index({ status: 1, requestedAt: -1 });
WithdrawalSchema.index({ createdAt: -1 });

// Calculate net amount before saving
WithdrawalSchema.pre('save', function(next) {
  if (this.processingFee) {
    this.netAmount = this.amount - this.processingFee;
  } else {
    this.netAmount = this.amount;
  }
  next();
});

// Virtual for processing time
WithdrawalSchema.virtual('processingTime').get(function() {
  if (this.processedAt && this.requestedAt) {
    return this.processedAt - this.requestedAt;
  }
  return null;
});

export const Withdrawal = mongoose.model("Withdrawal", WithdrawalSchema);
