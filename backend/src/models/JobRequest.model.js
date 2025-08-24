import mongoose from "mongoose";

// Service Cost Breakdown Schema
const serviceCostSchema = new mongoose.Schema({
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true
  },
  serviceName: {
    type: String,
    required: true
  },
  serviceCode: {
    type: String,
    required: true
  },
  charge: {
    type: Number,
    required: true
  },
  unit: {
    type: String,
    required: true,
    enum: ['Per Day', 'Per Hour', 'Per Unit', 'Per Inspector', 'Fixed']
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  multiplier: {
    type: Number,
    required: true,
    default: 1
  },
  baseCost: {
    type: Number,
    required: true
  },
  taxRate: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  taxAmount: {
    type: Number,
    required: true
  },
  subtotal: {
    type: Number,
    required: true
  }
}, { _id: false });

// Additional Cost Factor Schema
const additionalCostSchema = new mongoose.Schema({
  factorId: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['percentage', 'fixed']
  },
  value: {
    type: Number,
    required: true,
    min: 0
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  }
}, { _id: false });

// Cost Totals Schema
const costTotalsSchema = new mongoose.Schema({
  baseCost: {
    type: Number,
    required: true,
    min: 0
  },
  tax: {
    type: Number,
    required: true,
    min: 0
  },
  additional: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  grandTotal: {
    type: Number,
    required: true,
    min: 0
  }
}, { _id: false });

// Complete Cost Breakdown Schema
const costBreakdownSchema = new mongoose.Schema({
  services: [serviceCostSchema],
  additional: [additionalCostSchema],
  totals: costTotalsSchema,
  currency: {
    type: String,
    required: true,
    default: 'USD'
  },
  calculatedAt: {
    type: Date,
    required: true,
    default: Date.now
  }
}, { _id: false });

// Negotiation Schema for quotations
const negotiationSchema = new mongoose.Schema({
  message: {
    type: String,
    required: true,
    trim: true
  },
  proposedAmount: {
    type: Number,
    default: null
  },
  counterOffer: {
    type: String,
    default: null
  },
  fromClient: {
    type: Boolean,
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

// Quotation History Schema (for tracking quote updates)
const quotationHistorySchema = new mongoose.Schema({
  providerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ServiceProviderProfile",
    required: true,
  },
  quotedAmount: {
    type: Number,
    required: true,
  },
  quotedCurrency: {
    type: String,
    required: true,
    default: "USD",
  },
  quotationDetails: {
    type: String,
    maxlength: 2000,
  },
  quotedAt: {
    type: Date,
    required: true,
    default: Date.now,
  },
  status: {
    type: String,
    required: true,
    enum: ["pending", "accepted", "rejected", "negotiating"],
    default: "pending",
  },
  validUntil: {
    type: Date,
  },
  // Add client response tracking
  clientResponse: {
    message: String,
    respondedAt: Date,
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  // Add negotiations array
  negotiations: [negotiationSchema],
  attachments: [
    {
      fileName: String,
      fileUrl: String,
      fileType: String,
      uploadedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
});

// Main Job Request Schema
const jobRequestSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },

    // Location Information
    location: {
      type: String,
      required: true,
      trim: true,
    },
    region: {
      type: String,
      required: true,
    },

    // Client Information
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    clientName: {
      type: String,
      required: true,
    },
    clientEmail: {
      type: String,
      required: true,
    },
    clientPhone: {
      type: String,
    },

    // Provider Information
    assignedProviderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ServiceProviderProfile",
      required: true,
    },
    providerName: {
      type: String,
      required: true,
    },

    // Service Requirements
    requiredServices: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Service",
        required: true,
      },
    ],
    serviceQuantities: {
      type: Map,
      of: Number,
      required: true,
    },

    // Project Parameters
    projectDuration: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    numInspectors: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },

    // Additional Cost Factors (stored as key-value pairs)
    additionalCostFactors: {
      type: Map,
      of: Number,
      default: new Map(),
    },

    // Cost Information
    costDetails: costBreakdownSchema,
    estimatedTotal: {
      type: Number,
      required: true,
      min: 0,
    },
    finalQuotedAmount: {
      type: Number,
      min: 0,
    },

    // Priority and Special Requirements
    isPremium: {
      type: Boolean,
      required: true,
      default: false,
    },
    urgencyLevel: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },

    // Timeline
    preferredStartDate: {
      type: Date,
    },
    expectedCompletionDate: {
      type: Date,
    },
    actualStartDate: {
      type: Date,
    },
    actualCompletionDate: {
      type: Date,
    },

    // Status Tracking
    status: {
      type: String,
      required: true,
      enum: [
        "draft", // Created but not submitted
        "open", // Submitted and waiting for provider response
        "quoted", // Provider has provided quotation
        "negotiating", // In negotiation phase
        "accepted", // Quote accepted, work can begin
        "in_progress", // Work is ongoing
        "completed", // Work completed
        "delivered", // Report/results delivered
        "closed", // Job closed successfully
        "cancelled", // Cancelled by client
        "rejected", // Rejected by provider
        "disputed", // In dispute
        "on_hold", // Temporarily on hold
      ],
      default: "open",
    },

    // Quotation Management
    quotationHistory: [quotationHistorySchema],
    currentQuotation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "quotationHistory",
    },

    // Communication and Notes
    internalNotes: [
      {
        note: {
          type: String,
          required: true,
          maxlength: 1000,
        },
        addedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        addedAt: {
          type: Date,
          required: true,
          default: Date.now,
        },
        noteType: {
          type: String,
          enum: ["general", "technical", "commercial", "logistics"],
          default: "general",
        },
      },
    ],

    // File Attachments
    attachments: [
      {
        fileName: {
          type: String,
          required: true,
        },
        originalFileName: {
          type: String,
          required: true,
        },
        fileUrl: {
          type: String,
          required: true,
        },
        fileType: {
          type: String,
          required: true,
        },
        fileSize: {
          type: Number,
          required: true,
        },
        uploadedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        uploadedAt: {
          type: Date,
          required: true,
          default: Date.now,
        },
        category: {
          type: String,
          enum: [
            "drawing",
            "specification",
            "report",
            "certificate",
            "photo",
            "other",
          ],
          default: "other",
        },
      },
    ],

    // Compliance and Quality
    complianceRequirements: [
      {
        standard: {
          type: String,
          required: true,
        },
        version: String,
        mandatory: {
          type: Boolean,
          default: true,
        },
      },
    ],

    // Payment Information
    paymentTerms: {
      type: String,
      enum: [
        "advance_100",
        "advance_50_balance_50",
        "net_30",
        "net_15",
        "on_completion",
        "milestone_based",
      ],
      default: "on_completion",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "partial", "completed", "overdue"],
      default: "pending",
    },

    // Audit Trail
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    lastModifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // Workflow and Approvals
    approvalRequired: {
      type: Boolean,
      default: false,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    approvedAt: {
      type: Date,
    },

    // Performance Metrics
    responseTime: {
      type: Number, // Time in hours for provider to respond
    },
    completionTime: {
      type: Number, // Time in hours to complete the job
    },
    clientSatisfactionRating: {
      type: Number,
      min: 1,
      max: 5,
    },    providerRating: {
      type: Number,
      min: 1,
      max: 5,
    },

    // Payment Information
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
    },
    paymentAmount: {
      type: Number,
      min: 0,
    },
    paidAt: {
      type: Date,
    },
    
    // Client Rating and Review
    clientRating: {
      rating: {
        type: Number,
        min: 1,
        max: 5,
      },
      review: {
        type: String,
        maxlength: 1000,
      },
      submittedAt: {
        type: Date,
      },
      submittedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    },

    type:{type:String,default:"provider"}
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
    collection: "jobrequests",
  }
);

// Indexes for better query performance
jobRequestSchema.index({ clientId: 1, status: 1 });
jobRequestSchema.index({ assignedProviderId: 1, status: 1 });
jobRequestSchema.index({ location: 1, region: 1 });
jobRequestSchema.index({ createdAt: -1 });
jobRequestSchema.index({ status: 1, createdAt: -1 });
jobRequestSchema.index({ isPremium: 1, status: 1 });

// Virtual for calculating days since creation
jobRequestSchema.virtual('daysSinceCreated').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Virtual for checking if job is overdue
jobRequestSchema.virtual('isOverdue').get(function() {
  if (this.expectedCompletionDate) {
    return new Date() > this.expectedCompletionDate && !['completed', 'delivered', 'closed'].includes(this.status);
  }
  return false;
});

// Pre-save middleware to update lastModifiedBy
jobRequestSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.lastModifiedBy = this.modifiedBy || this.createdBy;
  }
  next();
});

// Method to add quotation to history
jobRequestSchema.methods.addQuotation = function(quotationData) {
  this.quotationHistory.push(quotationData);
  this.currentQuotation = this.quotationHistory[this.quotationHistory.length - 1]._id;
  this.status = 'quoted';
  return this.save();
};

// Method to update job status with validation
jobRequestSchema.methods.updateStatus = function(newStatus, userId) {
  const validTransitions = {
    draft: ["open", "cancelled"],
    open: ["quoted", "rejected", "cancelled", "on_hold", "accepted"],
    quoted: ["negotiating", "accepted", "rejected", "cancelled"],
    negotiating: ["quoted", "accepted", "rejected", "cancelled"],
    accepted: ["in_progress", "cancelled", "on_hold"],
    in_progress: ["completed", "on_hold", "cancelled"],
    completed: ["delivered", "disputed"],
    delivered: ["closed", "disputed"],
    on_hold: ["open", "in_progress", "cancelled"],
    disputed: ["in_progress", "completed", "cancelled"],
    cancelled: [], // Terminal state
    rejected: [], // Terminal state
    closed: [], // Terminal state
  };

  if (validTransitions[this.status] && validTransitions[this.status].includes(newStatus)) {
    this.status = newStatus;
    this.lastModifiedBy = userId;
    return this.save();
  } else {
    throw new Error(`Invalid status transition from ${this.status} to ${newStatus}`);
  }
};

// Method to calculate total project value including all costs
jobRequestSchema.methods.calculateTotalValue = function() {
  if (this.finalQuotedAmount) {
    return this.finalQuotedAmount;
  }
  return this.estimatedTotal;
};

// Static method to find jobs by provider with filters
jobRequestSchema.statics.findByProvider = function(providerId, filters = {}) {
  const query = { assignedProviderId: providerId };
  
  if (filters.status) query.status = filters.status;
  if (filters.region) query.region = filters.region;
  if (filters.isPremium !== undefined) query.isPremium = filters.isPremium;
  if (filters.dateFrom) query.createdAt = { $gte: new Date(filters.dateFrom) };
  if (filters.dateTo) {
    query.createdAt = query.createdAt || {};
    query.createdAt.$lte = new Date(filters.dateTo);
  }
  
  return this.find(query)
    .populate('clientId', 'name email')
    .populate('requiredServices', 'name code')
    .sort({ createdAt: -1 });
};

// Static method to find jobs by client
jobRequestSchema.statics.findByClient = function(clientId, filters = {}) {
  const query = { clientId: clientId };
  
  if (filters.status) query.status = filters.status;
  if (filters.region) query.region = filters.region;
  
  return this.find(query)
    .populate('assignedProviderId', 'companyName companyLocation')
    .populate('requiredServices', 'name code')
    .sort({ createdAt: -1 });
};

// Export the model
export const JobRequest = mongoose.model('JobRequest', jobRequestSchema);