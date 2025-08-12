import mongoose from "mongoose";

const AdminSettingsSchema = new mongoose.Schema(
  {
    // Payment & Fee Settings
    platformFeePercentage: {
      type: Number,
      default: 5,
      min: 0,
      max: 50,
      required: true,
    },
    processingFeePercentage: {
      type: Number,
      default: 2.9,
      min: 0,
      max: 10,
      required: true,
    },
    fixedProcessingFee: {
      type: Number,
      default: 0.3,
      min: 0,
      max: 5,
      required: true,
    },

    // Provider & Inspector Commission Settings
    providerCommissionPercentage: {
      type: Number,
      default: 85,
      min: 50,
      max: 100,
      required: true,
    },
    inspectorCommissionPercentage: {
      type: Number,
      default: 80,
      min: 50,
      max: 100,
      required: true,
    },

    // Withdrawal Settings
    minimumWithdrawalAmount: {
      type: Number,
      default: 10,
      min: 1,
      max: 100,
      required: true,
    },
    withdrawalProcessingDays: {
      type: Number,
      default: 7,
      min: 1,
      max: 30,
      required: true,
    },

    // Withdrawal Method Fees
    withdrawalFees: {
      bank_transfer: {
        percentage: { type: Number, default: 0, min: 0, max: 5 },
        fixed: { type: Number, default: 0, min: 0, max: 10 },
      },
      paypal: {
        percentage: { type: Number, default: 1, min: 0, max: 5 },
        fixed: { type: Number, default: 0, min: 0, max: 10 },
      },
      stripe: {
        percentage: { type: Number, default: 0.5, min: 0, max: 5 },
        fixed: { type: Number, default: 0, min: 0, max: 10 },
      },
      crypto: {
        percentage: { type: Number, default: 2, min: 0, max: 10 },
        fixed: { type: Number, default: 0, min: 0, max: 50 },
      },
    },

    // Flag for active settings
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
AdminSettingsSchema.index({ createdAt: -1 });
AdminSettingsSchema.index(
  { isActive: 1 },
  {
    unique: true,
    partialFilterExpression: { isActive: true },
  }
);

// Virtuals
AdminSettingsSchema.virtual("calculateProcessingFee").get(function () {
  return (amount) => {
    return (
      (amount * this.processingFeePercentage) / 100 + this.fixedProcessingFee
    );
  };
});

AdminSettingsSchema.virtual("calculatePlatformFee").get(function () {
  return (amount) => {
    return (amount * this.platformFeePercentage) / 100;
  };
});

AdminSettingsSchema.virtual("calculateWithdrawalFee").get(function () {
  return (amount, method) => {
    const methodFees = this.withdrawalFees[method];
    if (!methodFees) return 0;
    return (amount * methodFees.percentage) / 100 + methodFees.fixed;
  };
});

// Static: Get or create settings
AdminSettingsSchema.statics.getCurrentSettings = async function () {
  let settings = await this.findOne({ isActive: true });
  if (!settings) {
    settings = new this({ isActive: true });
    await settings.save();
  }
  return settings;
};

// Instance method: Calculate total fees
AdminSettingsSchema.methods.calculateTotalFees = function (
  baseAmount,
  includeProcessing = true
) {
  const platformFee = this.calculatePlatformFee(baseAmount);
  const processingFee = includeProcessing
    ? this.calculateProcessingFee(baseAmount + platformFee)
    : 0;
  return {
    baseAmount,
    platformFee,
    processingFee,
    totalFees: platformFee + processingFee,
    totalAmount: baseAmount + platformFee + processingFee,
  };
};

// Instance method: Calculate earnings
AdminSettingsSchema.methods.calculateEarnings = function (
  paymentAmount,
  userType = "provider"
) {
  const commissionField =
    userType === "inspector"
      ? "inspectorCommissionPercentage"
      : "providerCommissionPercentage";
  const commissionPercentage = this[commissionField];
  const earnings = paymentAmount * (commissionPercentage / 100);
  return {
    paymentAmount,
    commissionPercentage,
    earnings,
    platformShare: paymentAmount - earnings,
  };
};

export const AdminSettings = mongoose.model(
  "AdminSettings",
  AdminSettingsSchema
);
