// Contact Access Model
// File: backend/src/models/ContactAccess.model.js

import mongoose from "mongoose";

const contactAccessSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Provider fields (optional)
  providerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceProviderProfile',
    default: null,
    index: true
  },
  providerEmail: {
    type: String,
    default: null
  },
  providerPhone: {
    type: String,
    default: null
  },
  
  // Inspector fields (optional)
  inspectorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InspectorProfile',
    default: null,
    index: true
  },
  inspectorEmail: {
    type: String,
    default: null
  },
  inspectorPhone: {
    type: String,
    default: null
  },
  
  // Contact type to distinguish between provider and inspector
  contactType: {
    type: String,
    enum: ['provider', 'inspector'],
    // required: true,
    index: true
  },
  
  // Contact name for easier querying
  contactName: {
    type: String,
  },
  
  amountPaid: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    required: true,
    default: 'USD',
    uppercase: true
  },
  transactionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'succeeded', 'failed', 'cancelled'],
    default: 'pending',
    index: true
  },
  accessDate: {
    type: Date,
    default: Date.now,
    index: true
  },
  emailSent: {
    type: Boolean,
    default: false,
    index: true
  },
  // Additional metadata
  paymentMethod: {
    type: String,
    default: 'card'
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
contactAccessSchema.index({ userId: 1, providerId: 1 });
contactAccessSchema.index({ userId: 1, inspectorId: 1 });
contactAccessSchema.index({ paymentStatus: 1, accessDate: -1 });
contactAccessSchema.index({ contactType: 1, paymentStatus: 1, accessDate: -1 });
contactAccessSchema.index({ createdAt: -1 });

// Instance methods
contactAccessSchema.methods.markEmailSent = function() {
  this.emailSent = true;
  return this.save();
};

// Static methods
contactAccessSchema.statics.getRevenueStats = function(startDate, endDate) {
  const matchStage = {
    paymentStatus: 'succeeded'
  };
  
  if (startDate && endDate) {
    matchStage.accessDate = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }

  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$amountPaid' },
        totalTransactions: { $sum: 1 },
        uniqueUsers: { $addToSet: '$userId' },
        uniqueProviders: { $addToSet: '$providerId' }
      }
    },
    {
      $project: {
        totalRevenue: 1,
        totalTransactions: 1,
        uniqueUsers: { $size: '$uniqueUsers' },
        uniqueProviders: { $size: '$uniqueProviders' },
        averageTransactionValue: { $divide: ['$totalRevenue', '$totalTransactions'] }
      }
    }
  ]);
};

contactAccessSchema.statics.getTopProviders = function(limit = 10) {
  return this.aggregate([
    { $match: { paymentStatus: 'succeeded', contactType: 'provider' } },
    {
      $group: {
        _id: '$providerId',
        totalRevenue: { $sum: '$amountPaid' },
        totalAccesses: { $sum: 1 },
        uniqueUsers: { $addToSet: '$userId' }
      }
    },
    {
      $lookup: {
        from: 'serviceproviderprofiles',
        localField: '_id',
        foreignField: 'userId',
        as: 'provider'
      }
    },
    { $unwind: '$provider' },
    {
      $project: {
        companyName: '$provider.companyName',
        totalRevenue: 1,
        totalAccesses: 1,
        uniqueUsers: { $size: '$uniqueUsers' }
      }
    },
    { $sort: { totalRevenue: -1 } },
    { $limit: limit }
  ]);
};

contactAccessSchema.statics.getTopInspectors = function(limit = 10) {
  return this.aggregate([
    { $match: { paymentStatus: 'succeeded', contactType: 'inspector' } },
    {
      $group: {
        _id: '$inspectorId',
        totalRevenue: { $sum: '$amountPaid' },
        totalAccesses: { $sum: 1 },
        uniqueUsers: { $addToSet: '$userId' }
      }
    },
    {
      $lookup: {
        from: 'inspectorprofiles',
        localField: '_id',
        foreignField: 'userId',
        as: 'inspector'
      }
    },
    { $unwind: '$inspector' },
    {
      $project: {
        fullName: '$inspector.fullName',
        companyName: '$inspector.companyName',
        totalRevenue: 1,
        totalAccesses: 1,
        uniqueUsers: { $size: '$uniqueUsers' }
      }
    },
    { $sort: { totalRevenue: -1 } },
    { $limit: limit }
  ]);
};

contactAccessSchema.statics.getInspectorStats = function(startDate, endDate) {
  const matchStage = {
    paymentStatus: 'succeeded',
    contactType: 'inspector'
  };
  
  if (startDate && endDate) {
    matchStage.accessDate = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }

  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$amountPaid' },
        totalTransactions: { $sum: 1 },
        uniqueUsers: { $addToSet: '$userId' },
        uniqueInspectors: { $addToSet: '$inspectorId' }
      }
    },
    {
      $project: {
        totalRevenue: 1,
        totalTransactions: 1,
        uniqueUsers: { $size: '$uniqueUsers' },
        uniqueInspectors: { $size: '$uniqueInspectors' },
        averageTransactionValue: { $divide: ['$totalRevenue', '$totalTransactions'] }
      }
    }
  ]);
};

// Pre-save middleware
contactAccessSchema.pre('save', function(next) {
  // Set access date if not already set
  if (!this.accessDate) {
    this.accessDate = new Date();
  }
  
  // Validate that either providerId or inspectorId is set
  if (!this.providerId && !this.inspectorId) {
    return next(new Error('Either providerId or inspectorId must be provided'));
  }
  
  // Validate that only one of providerId or inspectorId is set
  if (this.providerId && this.inspectorId) {
    return next(new Error('Cannot set both providerId and inspectorId'));
  }
  
  // Set contactType based on the provided ID
  if (this.providerId) {
    this.contactType = 'provider';
  } else if (this.inspectorId) {
    this.contactType = 'inspector';
  }
  
  next();
});

// Virtual for formatted amount
contactAccessSchema.virtual('formattedAmount').get(function() {
  return `${this.amountPaid.toFixed(2)} ${this.currency}`;
});

// Ensure virtual fields are included in JSON output
contactAccessSchema.set('toJSON', { virtuals: true });
contactAccessSchema.set('toObject', { virtuals: true });

export const ContactAccess = mongoose.model('ContactAccess', contactAccessSchema);

