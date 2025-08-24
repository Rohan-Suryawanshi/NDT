import { AdminSettings } from '../models/AdminSettings.model.js';
import { AsyncHandler } from '../utils/AsyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';

// @desc    Get public fee settings
// @route   GET /api/v1/admin/settings/public
// @access  Public
export const getPublicFeeSettings = AsyncHandler(async (req, res) => {
  const settings = await AdminSettings.getCurrentSettings();
  
  // Return only fee-related settings that clients need
  const publicSettings = {
    platformFeePercentage: settings.platformFeePercentage,
    processingFeePercentage: settings.processingFeePercentage,
    fixedProcessingFee: settings.fixedProcessingFee
  };

  res.status(200).json(
    new ApiResponse(200, publicSettings, 'Public fee settings retrieved successfully')
  );
});

// @desc    Get current admin settings
// @route   GET /api/v1/admin/settings
// @access  Private (Admin only)
export const getAdminSettings = AsyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    throw new ApiError(403, 'Only admins can access admin settings');
  }

  const settings = await AdminSettings.getCurrentSettings();

  res.status(200).json(
    new ApiResponse(200, settings, 'Admin settings retrieved successfully')
  );
});

// @desc    Update admin settings
// @route   PUT /api/v1/admin/settings
// @access  Private (Admin only)
export const updateAdminSettings = AsyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    throw new ApiError(403, 'Only admins can update admin settings');
  }

  const updates = req.body;

  // Validate numeric fields
  const numericFields = [
    'platformFeePercentage',
    'processingFeePercentage',
    'fixedProcessingFee',
    'providerCommissionPercentage',
    'inspectorCommissionPercentage',
    'minimumWithdrawalAmount',
    'withdrawalProcessingDays'
  ];

  for (const field of numericFields) {
    if (updates[field] !== undefined) {
      const value = parseFloat(updates[field]);
      if (isNaN(value) || value < 0) {
        throw new ApiError(400, `${field} must be a valid positive number`);
      }
      updates[field] = value;
    }
  }

  // Validate percentage fields
  const percentageFields = [
    'platformFeePercentage',
    'processingFeePercentage',
    'providerCommissionPercentage',
    'inspectorCommissionPercentage'
  ];

  for (const field of percentageFields) {
    if (updates[field] !== undefined && (updates[field] < 0 || updates[field] > 100)) {
      throw new ApiError(400, `${field} must be between 0 and 100`);
    }
  }

  // Validate withdrawal fees if provided
  if (updates.withdrawalFees) {
    const validMethods = ['bank_transfer', 'paypal', 'stripe', 'crypto'];
    
    for (const [method, fees] of Object.entries(updates.withdrawalFees)) {
      if (!validMethods.includes(method)) {
        throw new ApiError(400, `Invalid withdrawal method: ${method}`);
      }
      
      if (fees.percentage !== undefined && (fees.percentage < 0 || fees.percentage > 10)) {
        throw new ApiError(400, `Withdrawal fee percentage for ${method} must be between 0 and 10`);
      }
      
      if (fees.fixed !== undefined && fees.fixed < 0) {
        throw new ApiError(400, `Fixed withdrawal fee for ${method} must be positive`);
      }
    }
  }

  // Update the settings
  const settings = await AdminSettings.getCurrentSettings();
  Object.assign(settings, updates);
  await settings.save();

  res.status(200).json(
    new ApiResponse(200, settings, 'Admin settings updated successfully')
  );
});

// @desc    Reset settings to defaults
// @route   POST /api/v1/admin/settings/reset
// @access  Private (Admin only)
export const resetSettingsToDefaults = AsyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    throw new ApiError(403, 'Only admins can reset settings');
  }

  const defaultSettings = {
    platformFeePercentage: 5,
    processingFeePercentage: 2.9,
    fixedProcessingFee: 0.3,
    providerCommissionPercentage: 85,
    inspectorCommissionPercentage: 80,
    minimumWithdrawalAmount: 10,
    withdrawalProcessingDays: 7,
    withdrawalFees: {
      bank_transfer: { percentage: 0, fixed: 0 },
      paypal: { percentage: 1, fixed: 0 },
      stripe: { percentage: 0.5, fixed: 0 },
      crypto: { percentage: 2, fixed: 0 }
    }
  };

  const settings = await AdminSettings.getCurrentSettings();
  Object.assign(settings, defaultSettings);
  await settings.save();

  res.status(200).json(
    new ApiResponse(200, settings, 'Settings reset to defaults successfully')
  );
});

// @desc    Calculate fees preview
// @route   POST /api/v1/admin/settings/calculate-fees
// @access  Private (Admin only)
export const calculateFeesPreview = AsyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    throw new ApiError(403, 'Only admins can access fee calculations');
  }

  const { amount, userType = 'provider', withdrawalMethod } = req.body;

  if (!amount || amount <= 0) {
    throw new ApiError(400, 'Amount must be a positive number');
  }

  const settings = await AdminSettings.getCurrentSettings();
  
  // Calculate payment fees
  const paymentFees = settings.calculateTotalFees(amount);
  
  // Calculate earnings
  const earnings = settings.calculateEarnings(amount, userType);
  
  // Calculate withdrawal fees if method provided
  let withdrawalFees = null;
  if (withdrawalMethod) {
    const withdrawalFee = settings.calculateWithdrawalFee(earnings.earnings, withdrawalMethod);
    withdrawalFees = {
      method: withdrawalMethod,
      fee: withdrawalFee,
      netAmount: earnings.earnings - withdrawalFee
    };
  }

  res.status(200).json(
    new ApiResponse(200, {
      inputAmount: amount,
      userType,
      paymentBreakdown: paymentFees,
      earningsBreakdown: earnings,
      withdrawalBreakdown: withdrawalFees
    }, 'Fee calculation completed successfully')
  );
});