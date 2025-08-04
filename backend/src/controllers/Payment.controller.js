import Stripe from 'stripe';
import { JobRequest } from '../models/JobRequest.model.js';
import { User } from '../models/User.model.js';
import { AsyncHandler } from '../utils/AsyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import mongoose from 'mongoose';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Payment Schema for tracking payments
const paymentSchema = new mongoose.Schema({
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'JobRequest',
    required: true
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  stripePaymentIntentId: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    required: true,
    default: 'usd'
  },
  status: {
    type: String,
    enum: ['pending', 'succeeded', 'failed', 'cancelled'],
    default: 'pending'
  },
  platformFee: {
    type: Number,
    required: true
  },
  processingFee: {
    type: Number,
    required: true
  },
  baseAmount: {
    type: Number,
    required: true
  },
  totalAmount: {
    type: Number,
    required: true
  },
  metadata: {
    type: Object,
    default: {}
  }
}, { timestamps: true });

const Payment = mongoose.model('Payment', paymentSchema);

// Withdrawal Schema for tracking withdrawal requests
const withdrawalSchema = new mongoose.Schema({
  providerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 10
  },
  method: {
    type: String,
    required: true,
    enum: ['bank_transfer', 'paypal', 'stripe', 'wire_transfer']
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  requestedAt: {
    type: Date,
    default: Date.now
  },
  processedAt: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  notes: {
    type: String,
    maxlength: 500
  },
  adminNotes: {
    type: String,
    maxlength: 1000
  },
  transactionId: {
    type: String
  },
  fees: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

const Withdrawal = mongoose.model('Withdrawal', withdrawalSchema);

// Provider Balance Schema for tracking balances
const providerBalanceSchema = new mongoose.Schema({
  providerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  totalEarnings: {
    type: Number,
    default: 0
  },
  availableBalance: {
    type: Number,
    default: 0
  },
  pendingBalance: {
    type: Number,
    default: 0
  },
  totalWithdrawn: {
    type: Number,
    default: 0
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

const ProviderBalance = mongoose.model('ProviderBalance', providerBalanceSchema);

// @desc    Create payment intent
// @route   POST /api/v1/payments/create-payment-intent
// @access  Private (Client only)
export const createPaymentIntent = AsyncHandler(async (req, res) => {
  const { jobId, amount, currency = 'usd', description } = req.body;

  console.log(req.body)

  if (!jobId || !amount) {
    throw new ApiError(400, 'Job ID and amount are required');
  }

  // Verify job exists and belongs to the client
  const job = await JobRequest.findById(jobId);
  if (!job) {
    throw new ApiError(404, 'Job not found');
  }

  if (job.clientId.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'Not authorized to pay for this job');
  }

  if (job.status !== 'closed') {
    throw new ApiError(400, 'Job must be closed to make payment');
  }

  // Check if payment already exists
  const existingPayment = await Payment.findOne({ 
    jobId, 
    status: { $in: ['succeeded', 'pending'] } 
  });
  
  if (existingPayment) {
    throw new ApiError(400, 'Payment already exists for this job');
  }

  // Calculate fees
  const baseAmount = job.estimatedTotal;
  const platformFee = (baseAmount * 5) / 100; // 5% platform fee
  const processingFee = ((baseAmount + platformFee) * 2.9) / 100 + 0.30; // Stripe fees
  const totalAmount = baseAmount + platformFee + processingFee;

  // Create payment intent with Stripe
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(totalAmount * 100), // Convert to cents
    currency,
    description: description || `Payment for job: ${job.title}`,
    metadata: {
      jobId: jobId,
      clientId: req.user._id.toString(),
      baseAmount: baseAmount.toString(),
      platformFee: platformFee.toString(),
      processingFee: processingFee.toString()
    }
  });

  // Save payment record
  const payment = new Payment({
    jobId,
    clientId: req.user._id,
    stripePaymentIntentId: paymentIntent.id,
    amount: Math.round(totalAmount * 100),
    currency,
    baseAmount,
    platformFee,
    processingFee,
    totalAmount,
    metadata: {
      jobTitle: job.title,
      jobDescription: job.description
    }
  });

  await payment.save();

  res.status(201).json(
    new ApiResponse(201, {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: totalAmount,
      breakdown: {
        baseAmount,
        platformFee,
        processingFee,
        totalAmount
      }
    }, 'Payment intent created successfully')
  );
});

// @desc    Confirm payment
// @route   POST /api/v1/payments/confirm-payment
// @access  Private (Client only)
export const confirmPayment = AsyncHandler(async (req, res) => {
  const { jobId, paymentIntentId, status } = req.body;

  if (!jobId || !paymentIntentId || !status) {
    throw new ApiError(400, 'Job ID, payment intent ID, and status are required');
  }

  // Find payment record
  const payment = await Payment.findOne({
    jobId,
    stripePaymentIntentId: paymentIntentId,
    clientId: req.user._id
  });

  if (!payment) {
    throw new ApiError(404, 'Payment record not found');
  }

  // Verify payment with Stripe
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
  
  if (paymentIntent.status !== 'succeeded') {
    throw new ApiError(400, 'Payment not successful');
  }

  // Update payment status
  payment.status = 'succeeded';
  await payment.save();

  // Update job payment status
  const job = await JobRequest.findById(jobId);
  job.paymentStatus = 'paid';
  job.paidAt = new Date();
  job.paymentAmount = payment.totalAmount;
  await job.save();

  res.status(200).json(
    new ApiResponse(200, {
      payment,
      job: {
        id: job._id,
        title: job.title,
        paymentStatus: job.paymentStatus,
        paidAt: job.paidAt
      }
    }, 'Payment confirmed successfully')
  );
});

// @desc    Get payment history
// @route   GET /api/v1/payments/history
// @access  Private
export const getPaymentHistory = AsyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  const pageNumber = parseInt(page);
  const limitNumber = parseInt(limit);
  const skip = (pageNumber - 1) * limitNumber;

  const payments = await Payment.find({ clientId: req.user._id })
    .populate('jobId', 'title description location status')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNumber);

  const total = await Payment.countDocuments({ clientId: req.user._id });

  res.status(200).json(
    new ApiResponse(200, {
      payments,
      pagination: {
        currentPage: pageNumber,
        totalPages: Math.ceil(total / limitNumber),
        totalItems: total,
        itemsPerPage: limitNumber
      }
    }, 'Payment history retrieved successfully')
  );
});

// @desc    Webhook handler for Stripe events
// @route   POST /api/v1/payments/webhook
// @access  Public (Stripe webhook)
export const handleStripeWebhook = AsyncHandler(async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.log('Webhook signature verification failed.', err.message);
    throw new ApiError(400, 'Webhook signature verification failed');
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      
      // Update payment status
      const payment = await Payment.findOne({
        stripePaymentIntentId: paymentIntent.id
      });
      
      if (payment) {
        payment.status = 'succeeded';
        await payment.save();
        
        // Update job payment status
        const job = await JobRequest.findById(payment.jobId);
        if (job) {
          job.paymentStatus = 'paid';
          job.paidAt = new Date();
          job.paymentAmount = payment.totalAmount;
          await job.save();
        }
      }
      break;
      
    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      
      const failedPaymentRecord = await Payment.findOne({
        stripePaymentIntentId: failedPayment.id
      });
      
      if (failedPaymentRecord) {
        failedPaymentRecord.status = 'failed';
        await failedPaymentRecord.save();
      }
      break;
      
    default:
      console.log(`Unhandled event type ${event.type}`);
  }
  res.json({ received: true });
});

// @desc    Get provider balance
// @route   GET /api/v1/payments/provider-balance
// @access  Private (Provider only)
export const getProviderBalance = AsyncHandler(async (req, res) => {
  const providerId = req.user._id;

  // Find or create provider balance
  let balance = await ProviderBalance.findOne({ providerId });
  
  if (!balance) {
    balance = new ProviderBalance({ providerId });
    await balance.save();
  }

  // Calculate real-time balance from completed jobs
  const completedJobs = await JobRequest.find({
    assignedProviderId: providerId,
    status: 'closed',
    paymentStatus: 'paid'
  });

  const totalEarnings = completedJobs.reduce((sum, job) => {
    const providerShare = job.paymentAmount * 0.85; // 85% after 15% platform fee
    return sum + providerShare;
  }, 0);

  // Calculate withdrawn amount
  const completedWithdrawals = await Withdrawal.find({
    providerId,
    status: 'completed'
  });

  const totalWithdrawn = completedWithdrawals.reduce((sum, withdrawal) => sum + withdrawal.amount, 0);

  // Calculate pending withdrawals
  const pendingWithdrawals = await Withdrawal.find({
    providerId,
    status: { $in: ['pending', 'processing'] }
  });

  const pendingBalance = pendingWithdrawals.reduce((sum, withdrawal) => sum + withdrawal.amount, 0);

  const availableBalance = totalEarnings - totalWithdrawn - pendingBalance;

  // Update balance record
  balance.totalEarnings = totalEarnings;
  balance.availableBalance = Math.max(0, availableBalance);
  balance.pendingBalance = pendingBalance;
  balance.totalWithdrawn = totalWithdrawn;
  balance.lastUpdated = new Date();
  await balance.save();

  res.status(200).json(
    new ApiResponse(200, balance, 'Provider balance retrieved successfully')
  );
});

// @desc    Request withdrawal
// @route   POST /api/v1/payments/request-withdrawal
// @access  Private (Provider only)
export const requestWithdrawal = AsyncHandler(async (req, res) => {
  const { amount, method, notes } = req.body;
  const providerId = req.user._id;

  if (!amount || amount < 10) {
    throw new ApiError(400, 'Minimum withdrawal amount is $10');
  }

  if (!method || !['bank_transfer', 'paypal', 'stripe', 'wire_transfer'].includes(method)) {
    throw new ApiError(400, 'Invalid withdrawal method');
  }

  // Get current balance
  const balance = await ProviderBalance.findOne({ providerId });
  if (!balance || balance.availableBalance < amount) {
    throw new ApiError(400, 'Insufficient balance for withdrawal');
  }

  // Check for existing pending withdrawals
  const existingPending = await Withdrawal.findOne({
    providerId,
    status: { $in: ['pending', 'processing'] }
  });

  if (existingPending) {
    throw new ApiError(400, 'You have a pending withdrawal request. Please wait for it to be processed.');
  }

  // Create withdrawal request
  const withdrawal = new Withdrawal({
    providerId,
    amount: parseFloat(amount),
    method,
    notes: notes?.trim(),
    status: 'pending'
  });

  await withdrawal.save();

  // Update balance to reflect pending withdrawal
  balance.availableBalance -= amount;
  balance.pendingBalance += amount;
  await balance.save();

  res.status(201).json(
    new ApiResponse(201, withdrawal, 'Withdrawal request submitted successfully')
  );
});

// @desc    Get withdrawal history
// @route   GET /api/v1/payments/withdraw-history
// @access  Private (Provider only)
export const getWithdrawHistory = AsyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const providerId = req.user._id;

  const pageNumber = parseInt(page);
  const limitNumber = parseInt(limit);
  const skip = (pageNumber - 1) * limitNumber;

  const withdrawals = await Withdrawal.find({ providerId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNumber);

  const total = await Withdrawal.countDocuments({ providerId });

  res.status(200).json(
    new ApiResponse(200, {
      withdrawals,
      pagination: {
        currentPage: pageNumber,
        totalPages: Math.ceil(total / limitNumber),
        totalItems: total,
        itemsPerPage: limitNumber
      }
    }, 'Withdrawal history retrieved successfully')
  );
});

// @desc    Get provider earnings history
// @route   GET /api/v1/payments/provider-earnings
// @access  Private (Provider only)
export const getProviderEarnings = AsyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const providerId = req.user._id;

  const pageNumber = parseInt(page);
  const limitNumber = parseInt(limit);
  const skip = (pageNumber - 1) * limitNumber;

  // Get completed and paid jobs
  const jobs = await JobRequest.find({
    assignedProviderId: providerId,
    status: 'closed',
    paymentStatus: 'paid'
  })
  .populate('clientId', 'fullName email')
  .sort({ paidAt: -1 })
  .skip(skip)
  .limit(limitNumber);

  // Transform to payment format
  const payments = jobs.map(job => ({
    jobId: job._id,
    jobTitle: job.title,
    clientName: job.clientId.fullName,
    amount: job.paymentAmount * 0.85, // Provider gets 85% after platform fee
    paidAt: job.paidAt,
    paymentMethod: 'stripe' // Default payment method
  }));

  const total = await JobRequest.countDocuments({
    assignedProviderId: providerId,
    status: 'closed',
    paymentStatus: 'paid'
  });

  res.status(200).json(
    new ApiResponse(200, {
      payments,
      pagination: {
        currentPage: pageNumber,
        totalPages: Math.ceil(total / limitNumber),
        totalItems: total,
        itemsPerPage: limitNumber
      }
    }, 'Provider earnings retrieved successfully')
  );
});

// @desc    Get inspector balance
// @route   GET /api/v1/payments/inspector-balance
// @access  Private (Inspector only)
export const getInspectorBalance = AsyncHandler(async (req, res) => {
  const inspectorId = req.user._id;

  // Find or create inspector balance (using same schema as ProviderBalance)
  let balance = await ProviderBalance.findOne({ providerId: inspectorId });
  
  if (!balance) {
    balance = new ProviderBalance({ providerId: inspectorId });
    await balance.save();
  }
  // Calculate real-time balance from completed inspections
  const completedInspections = await JobRequest.find({
    assignedProviderId: inspectorId, // Using provider field for now, can be inspector-specific later
    status: 'closed',
    paymentStatus: 'paid'
  });

  const totalEarnings = completedInspections.reduce((sum, inspection) => {
    const inspectorShare = inspection.paymentAmount * 0.80; // 80% after 20% platform fee for inspectors
    return sum + inspectorShare;
  }, 0);

  // Calculate withdrawn amount
  const completedWithdrawals = await Withdrawal.find({
    providerId: inspectorId,
    status: 'completed'
  });

  const totalWithdrawn = completedWithdrawals.reduce((sum, withdrawal) => sum + withdrawal.amount, 0);

  // Calculate pending withdrawals
  const pendingWithdrawals = await Withdrawal.find({
    providerId: inspectorId,
    status: { $in: ['pending', 'processing'] }
  });

  const pendingBalance = pendingWithdrawals.reduce((sum, withdrawal) => sum + withdrawal.amount, 0);

  const availableBalance = totalEarnings - totalWithdrawn - pendingBalance;

  // Update balance record
  balance.totalEarnings = totalEarnings;
  balance.availableBalance = Math.max(0, availableBalance);
  balance.pendingBalance = pendingBalance;
  balance.totalWithdrawn = totalWithdrawn;
  balance.lastUpdated = new Date();
  await balance.save();

  res.status(200).json(
    new ApiResponse(200, balance, 'Inspector balance retrieved successfully')
  );
});

// @desc    Get inspector earnings history
// @route   GET /api/v1/payments/inspector-earnings
// @access  Private (Inspector only)
export const getInspectorEarnings = AsyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const inspectorId = req.user._id;

  const pageNumber = parseInt(page);
  const limitNumber = parseInt(limit);
  const skip = (pageNumber - 1) * limitNumber;
  // Get completed and paid inspections
  const inspections = await JobRequest.find({
    assignedProviderId: inspectorId, // Using provider field for now, can be inspector-specific later
    status: 'closed',
    paymentStatus: 'paid'
  })
  .populate('clientId', 'fullName email')
  .sort({ paidAt: -1 })
  .skip(skip)
  .limit(limitNumber);

  // Transform to payment format
  const payments = inspections.map(inspection => ({
    jobId: inspection._id,
    jobTitle: inspection.title,
    clientName: inspection.clientId.fullName,
    amount: inspection.paymentAmount * 0.80, // Inspector gets 80% after platform fee
    paidAt: inspection.paidAt,
    paymentMethod: 'stripe' // Default payment method
  }));
  const total = await JobRequest.countDocuments({
    assignedProviderId: inspectorId,
    status: 'closed',
    paymentStatus: 'paid'
  });

  res.status(200).json(
    new ApiResponse(200, {
      payments,
      pagination: {
        currentPage: pageNumber,
        totalPages: Math.ceil(total / limitNumber),
        totalItems: total,
        itemsPerPage: limitNumber
      }
    }, 'Inspector earnings retrieved successfully')
  );
});

// @desc    Update withdrawal status (Admin only)
// @route   PATCH /api/v1/payments/withdraw/:id/status
// @access  Private (Admin only)
export const updateWithdrawalStatus = AsyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, adminNotes, transactionId } = req.body;

  if (req.user.role !== 'admin') {
    throw new ApiError(403, 'Only admins can update withdrawal status');
  }

  const withdrawal = await Withdrawal.findById(id);
  if (!withdrawal) {
    throw new ApiError(404, 'Withdrawal request not found');
  }

  const oldStatus = withdrawal.status;
  withdrawal.status = status;
  withdrawal.adminNotes = adminNotes;
  withdrawal.transactionId = transactionId;

  if (status === 'processing' && oldStatus === 'pending') {
    withdrawal.processedAt = new Date();
  }

  if (status === 'completed' && oldStatus !== 'completed') {
    withdrawal.completedAt = new Date();
  }

  // If withdrawal is cancelled or failed, restore the balance
  if (['cancelled', 'failed'].includes(status) && ['pending', 'processing'].includes(oldStatus)) {
    const balance = await ProviderBalance.findOne({ providerId: withdrawal.providerId });
    if (balance) {
      balance.availableBalance += withdrawal.amount;
      balance.pendingBalance -= withdrawal.amount;
      await balance.save();
    }
  }

  // If withdrawal is completed, update total withdrawn
  if (status === 'completed' && oldStatus !== 'completed') {
    const balance = await ProviderBalance.findOne({ providerId: withdrawal.providerId });
    if (balance) {
      balance.pendingBalance -= withdrawal.amount;
      balance.totalWithdrawn += withdrawal.amount;
      await balance.save();
    }
  }

  await withdrawal.save();

  res.status(200).json(
    new ApiResponse(200, withdrawal, 'Withdrawal status updated successfully')
  );
});

export { Payment, Withdrawal, ProviderBalance };
