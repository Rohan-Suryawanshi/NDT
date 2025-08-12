import Stripe from 'stripe';
import { JobRequest } from '../models/JobRequest.model.js';
import { User } from '../models/User.model.js';
import { AsyncHandler } from '../utils/AsyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import mongoose from 'mongoose';
import { Withdrawal } from '../models/Withdrawal.model.js';
import { Payment } from "../models/Payment.model.js";
import { ProviderBalance } from '../models/ProviderBalance.model.js';
import { AdminSettings } from '../models/AdminSettings.model.js';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Provider Balance Schema for tracking balances


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
  
  // Get current admin settings for fee calculation
  const settings = await AdminSettings.getCurrentSettings();
  
  // Calculate fees using admin settings
  const baseAmount = job.estimatedTotal;
  const feeCalculation = settings.calculateTotalFees(baseAmount);
  
  const { platformFee, processingFee, totalAmount } = feeCalculation;

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

  res.status(201).json(    new ApiResponse(201, {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: totalAmount,
      breakdown: feeCalculation
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

  // Get admin settings for commission calculation
  const settings = await AdminSettings.getCurrentSettings();

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
    const earnings = settings.calculateEarnings(job.paymentAmount, 'provider');
    return sum + earnings.earnings;
  }, 0);
  // Calculate withdrawn amount
  const completedWithdrawals = await Withdrawal.find({
    userId: providerId,
    status: 'completed'
  });

  const totalWithdrawn = completedWithdrawals.reduce((sum, withdrawal) => sum + withdrawal.amount, 0);

  // Calculate pending withdrawals
  const pendingWithdrawals = await Withdrawal.find({
    userId: providerId,
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
  const { 
    amount, 
    withdrawalMethod, 
    method, // Legacy support
    bankDetails, 
    paypalDetails, 
    cryptoDetails, 
    metadata 
  } = req.body;
  const providerId = req.user._id;

  // Get admin settings for validation
  const settings = await AdminSettings.getCurrentSettings();

  // Support both new and legacy field names
  const finalMethod = withdrawalMethod || method;

  if (!amount || amount < settings.minimumWithdrawalAmount) {
    throw new ApiError(400, `Minimum withdrawal amount is $${settings.minimumWithdrawalAmount}`);
  }

  if (!finalMethod || !['bank_transfer', 'paypal', 'stripe', 'crypto'].includes(finalMethod)) {
    throw new ApiError(400, 'Invalid withdrawal method');
  }

  // Validate payment method specific details
  if (finalMethod === 'bank_transfer') {
    if (!bankDetails || !bankDetails.accountNumber || !bankDetails.routingNumber || 
        !bankDetails.bankName || !bankDetails.accountHolderName) {
      throw new ApiError(400, 'Bank transfer requires complete bank details');
    }
  } else if (finalMethod === 'paypal') {
    if (!paypalDetails || !paypalDetails.email) {
      throw new ApiError(400, 'PayPal withdrawal requires email address');
    }
  } else if (finalMethod === 'crypto') {
    if (!cryptoDetails || !cryptoDetails.walletAddress || !cryptoDetails.currency) {
      throw new ApiError(400, 'Crypto withdrawal requires wallet address and currency');
    }
  }

  // Get current balance
  const balance = await ProviderBalance.findOne({ providerId });
  if (!balance || balance.availableBalance < amount) {
    throw new ApiError(400, 'Insufficient balance for withdrawal');
  }
  
  // Check for existing pending withdrawals
  const existingPending = await Withdrawal.findOne({
    userId: providerId,
    status: { $in: ['pending', 'processing'] }
  });

  if (existingPending) {
    throw new ApiError(400, 'You have a pending withdrawal request. Please wait for it to be processed.');
  }
    // Create withdrawal request
  const withdrawalData = {
    userId: providerId,
    amount: parseFloat(amount),
    withdrawalMethod: finalMethod,
    status: 'pending',
    metadata: metadata || {}
  };

  // Calculate withdrawal fee using admin settings
  const withdrawalFee = settings.calculateWithdrawalFee(amount, finalMethod);
  if (withdrawalFee > 0) {
    withdrawalData.processingFee = withdrawalFee;
  }

  // Add payment method specific details
  if (finalMethod === 'bank_transfer' && bankDetails) {
    withdrawalData.bankDetails = bankDetails;
  } else if (finalMethod === 'paypal' && paypalDetails) {
    withdrawalData.paypalDetails = paypalDetails;
  } else if (finalMethod === 'crypto' && cryptoDetails) {
    withdrawalData.cryptoDetails = cryptoDetails;
  }

  const withdrawal = new Withdrawal(withdrawalData);
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
  const withdrawals = await Withdrawal.find({ userId: providerId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNumber);

  const total = await Withdrawal.countDocuments({ userId: providerId });

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

  // Get admin settings for commission calculation
  const settings = await AdminSettings.getCurrentSettings();

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
  const payments = jobs.map(job => {
    const earnings = settings.calculateEarnings(job.paymentAmount, 'provider');
    return {
      jobId: job._id,
      jobTitle: job.title,
      clientName: job.clientId.fullName,
      amount: earnings.earnings,
      paidAt: job.paidAt,
      paymentMethod: 'stripe' // Default payment method
    };
  });

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

  // Get admin settings for commission calculation
  const settings = await AdminSettings.getCurrentSettings();

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
    const earnings = settings.calculateEarnings(inspection.paymentAmount, 'inspector');
    return sum + earnings.earnings;
  }, 0);
  // Calculate withdrawn amount
  const completedWithdrawals = await Withdrawal.find({
    userId: inspectorId,
    status: 'completed'
  });

  const totalWithdrawn = completedWithdrawals.reduce((sum, withdrawal) => sum + withdrawal.amount, 0);

  // Calculate pending withdrawals
  const pendingWithdrawals = await Withdrawal.find({
    userId: inspectorId,
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

  // Get admin settings for commission calculation
  const settings = await AdminSettings.getCurrentSettings();

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
  const payments = inspections.map(inspection => {
    const earnings = settings.calculateEarnings(inspection.paymentAmount, 'inspector');
    return {
      jobId: inspection._id,
      jobTitle: inspection.title,
      clientName: inspection.clientId.fullName,
      amount: earnings.earnings,
      paidAt: inspection.paidAt,
      paymentMethod: 'stripe' // Default payment method
    };
  });
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
  const { status, adminNote, transactionId, processingFee } = req.body;

  if (req.user.role !== 'admin') {
    throw new ApiError(403, 'Only admins can update withdrawal status');
  }

  const withdrawal = await Withdrawal.findById(id);
  if (!withdrawal) {
    throw new ApiError(404, 'Withdrawal request not found');
  }

  const oldStatus = withdrawal.status;
  withdrawal.status = status;
  withdrawal.transactionId = transactionId;

  // Add admin note if provided
  if (adminNote) {
    if (!withdrawal.adminNotes) {
      withdrawal.adminNotes = [];
    }
    withdrawal.adminNotes.push({
      note: adminNote,
      addedBy: req.user._id,
      addedAt: new Date()
    });
  }

  // Update processing fee if provided
  if (processingFee !== undefined) {
    withdrawal.processingFee = parseFloat(processingFee);
  }

  // Set appropriate timestamps
  if (status === 'processing' && oldStatus === 'pending') {
    withdrawal.processedAt = new Date();
  } else if (status === 'completed' && oldStatus !== 'completed') {
    withdrawal.completedAt = new Date();
  } else if (status === 'rejected' && oldStatus !== 'rejected') {
    withdrawal.rejectedAt = new Date();
  }

  // Handle balance updates based on status changes
  const balance = await ProviderBalance.findOne({ providerId: withdrawal.userId });
  
  if (balance) {
    // If withdrawal is cancelled or rejected, restore the balance
    if (['cancelled', 'rejected'].includes(status) && ['pending', 'processing'].includes(oldStatus)) {
      balance.availableBalance += withdrawal.amount;
      balance.pendingBalance -= withdrawal.amount;
      await balance.save();
    }

    // If withdrawal is completed, update total withdrawn
    if (status === 'completed' && oldStatus !== 'completed') {
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

// @desc    Get all withdrawals (Admin only)
// @route   GET /api/v1/payments/admin/withdrawals
// @access  Private (Admin only)
export const getAllWithdrawals = AsyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status, search, dateRange } = req.query;

  if (req.user.role !== 'admin') {
    throw new ApiError(403, 'Only admins can view all withdrawals');
  }

  const pageNumber = parseInt(page);
  const limitNumber = parseInt(limit);
  const skip = (pageNumber - 1) * limitNumber;

  // Build query filters
  let query = {};
  
  if (status && status !== 'all') {
    query.status = status;
  }

  if (search) {
    // Search in user details or transaction ID
    query.$or = [
      { transactionId: { $regex: search, $options: 'i' } },
      { 'bankDetails.accountHolderName': { $regex: search, $options: 'i' } }
    ];
  }

  if (dateRange && dateRange !== 'all') {
    const now = new Date();
    let startDate;
    
    switch (dateRange) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        const quarterStart = Math.floor(now.getMonth() / 3) * 3;
        startDate = new Date(now.getFullYear(), quarterStart, 1);
        break;
      default:
        startDate = null;
    }
    
    if (startDate) {
      query.requestedAt = { $gte: startDate };
    }
  }

  // Get withdrawals with user details
  const withdrawals = await Withdrawal.find(query)
    .populate('userId', 'name email avatar')
    .sort({ requestedAt: -1 })
    .skip(skip)
    .limit(limitNumber);

  const total = await Withdrawal.countDocuments(query);

  res.status(200).json(
    new ApiResponse(200, {
      withdrawals,
      pagination: {
        currentPage: pageNumber,
        totalPages: Math.ceil(total / limitNumber),
        totalItems: total,
        itemsPerPage: limitNumber
      }
    }, 'All withdrawals retrieved successfully')
  );
});

// @desc    Get payment statistics for admin dashboard
// @route   GET /api/v1/payments/admin/stats
// @access  Private (Admin only)
export const getPaymentStats = AsyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    throw new ApiError(403, 'Only admins can view payment statistics');
  }

  // Get withdrawal statistics
  const totalWithdrawals = await Withdrawal.aggregate([
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);

  const pendingWithdrawals = await Withdrawal.countDocuments({ status: 'pending' });
  
  const withdrawalStatusCounts = await Withdrawal.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);

  // Get payment statistics
  const totalPayments = await Payment.aggregate([
    { $group: { _id: null, total: { $sum: '$totalAmount' } } }
  ]);

  const totalUsers = await User.countDocuments();
  // Calculate active users based on recent creation instead of lastLogin since lastLogin field doesn't exist
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const activeUsers = await User.countDocuments({ 
    createdAt: { $gte: thirtyDaysAgo } 
  });

  // Monthly trends (last 6 months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const monthlyWithdrawals = await Withdrawal.aggregate([
    { $match: { requestedAt: { $gte: sixMonthsAgo } } },
    {
      $group: {
        _id: {
          year: { $year: '$requestedAt' },
          month: { $month: '$requestedAt' }
        },
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);

  const monthlyPayments = await Payment.aggregate([
    { $match: { createdAt: { $gte: sixMonthsAgo } } },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        total: { $sum: '$totalAmount' },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);

  // Get total withdrawals count for pagination
  const totalWithdrawalsCount = await Withdrawal.countDocuments();

  res.status(200).json(
    new ApiResponse(200, {
      totalWithdrawals: totalWithdrawals[0]?.total || 0,
      pendingWithdrawals,
      totalPayments: totalPayments[0]?.total || 0,
      totalUsers,
      activeUsers,
      withdrawalStatusCounts,
      totalWithdrawalsCount,
      monthlyTrends: {
        withdrawals: monthlyWithdrawals,
        payments: monthlyPayments
      }
    }, 'Payment statistics retrieved successfully')
  );
});

export { 
  Payment, 
  Withdrawal, 
  ProviderBalance, 
};
