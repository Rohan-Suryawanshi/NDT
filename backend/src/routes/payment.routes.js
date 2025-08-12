import { Router } from 'express';
import {
  createPaymentIntent,
  confirmPayment,
  getPaymentHistory,
  handleStripeWebhook,
  getProviderBalance,
  requestWithdrawal,
  getWithdrawHistory,
  getProviderEarnings,
  updateWithdrawalStatus,
  getInspectorBalance,
  getInspectorEarnings,
  getAllWithdrawals,
  getPaymentStats
} from '../controllers/Payment.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { isAdmin } from '../middlewares/isAdmin.js';

const router = Router();

// Protected routes (require authentication)
router.use(verifyJWT);

// Admin routes (require admin role)
router.route('/admin/withdrawals').get(isAdmin, getAllWithdrawals);
router.route('/admin/stats').get(isAdmin, getPaymentStats);

router.route('/create-payment-intent').post(createPaymentIntent);
router.route('/confirm-payment').post(confirmPayment);
router.route('/history').get(getPaymentHistory);

// Provider withdrawal routes
router.route('/provider-balance').get(getProviderBalance);
router.route('/request-withdrawal').post(requestWithdrawal);
router.route('/withdraw-history').get(getWithdrawHistory);
router.route('/provider-earnings').get(getProviderEarnings);
router.route('/withdraw/:id/status').patch(isAdmin, updateWithdrawalStatus);

// Inspector withdrawal routes
router.route('/inspector-balance').get(getInspectorBalance);
router.route('/inspector-earnings').get(getInspectorEarnings);

// Webhook route (no auth required for Stripe webhooks)
router.route('/webhook').post(handleStripeWebhook);

export default router;
