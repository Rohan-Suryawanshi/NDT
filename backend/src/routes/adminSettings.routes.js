import { Router } from 'express';
import {
  getAdminSettings,
  updateAdminSettings,
  resetSettingsToDefaults,
  calculateFeesPreview,
  getPublicFeeSettings
} from '../controllers/AdminSettings.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { isAdmin } from '../middlewares/isAdmin.js';

const router = Router();

// Public route for fee settings (no auth required)
router.route('/public')
  .get(getPublicFeeSettings);

// Apply authentication and admin middleware to protected routes
router.use(verifyJWT);
router.use(isAdmin);

// Admin settings routes
router.route('/')
  .get(getAdminSettings)
  .put(updateAdminSettings);

router.route('/reset')
  .post(resetSettingsToDefaults);

router.route('/calculate-fees')
  .post(calculateFeesPreview);

export default router;
