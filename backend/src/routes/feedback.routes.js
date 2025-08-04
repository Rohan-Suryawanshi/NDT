import { Router } from 'express';
import {
  submitFeedback,
  getInspectorFeedback,
  getProviderFeedback,
  getJobFeedback,
  updateFeedback,
  deleteFeedback,
  getFeedbackStats
} from '../controllers/Feedback.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

// Protected routes (require authentication)
router.use(verifyJWT);

// Feedback submission and management
router.route('/submit').post(submitFeedback);
router.route('/job/:jobId').get(getJobFeedback);
router.route('/stats').get(getFeedbackStats);
router.route('/:id').patch(updateFeedback).delete(deleteFeedback);

// Role-specific feedback retrieval
router.route('/inspector').get(getInspectorFeedback);
router.route('/provider').get(getProviderFeedback);

export default router;
