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
  getInspectorEarnings
} from '../controllers/Payment.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

// Protected routes (require authentication)
router.use(verifyJWT);

router.route('/create-payment-intent').post(createPaymentIntent);
router.route('/confirm-payment').post(confirmPayment);
router.route('/history').get(getPaymentHistory);

// Provider withdrawal routes
router.route('/provider-balance').get(getProviderBalance);
router.route('/request-withdrawal').post(requestWithdrawal);
router.route('/withdraw-history').get(getWithdrawHistory);
router.route('/provider-earnings').get(getProviderEarnings);
router.route('/withdraw/:id/status').patch(updateWithdrawalStatus);

// Inspector withdrawal routes
router.route('/inspector-balance').get(getInspectorBalance);
router.route('/inspector-earnings').get(getInspectorEarnings);

// Webhook route (no auth required for Stripe webhooks)
router.route('/webhook').post(handleStripeWebhook);

export default router;
