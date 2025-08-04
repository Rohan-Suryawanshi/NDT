import { JobRequest } from '../models/JobRequest.model.js';
import { User } from '../models/User.model.js';
import { AsyncHandler } from '../utils/AsyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import mongoose from 'mongoose';

// Feedback Schema for tracking client feedback
const feedbackSchema = new mongoose.Schema({
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
  providerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  inspectorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    maxlength: 1000
  },
  // Detailed ratings for service providers
  qualityRating: {
    type: Number,
    min: 1,
    max: 5
  },
  timelinessRating: {
    type: Number,
    min: 1,
    max: 5
  },
  communicationRating: {
    type: Number,
    min: 1,
    max: 5
  },
  wouldRecommend: {
    type: Boolean,
    default: false
  },
  serviceCategory: {
    type: String
  },
  // Job details for reference
  jobTitle: {
    type: String,
    required: true
  },
  clientName: {
    type: String,
    required: true
  },
  providerName: {
    type: String
  },
  inspectorName: {
    type: String
  },
  completedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

const Feedback = mongoose.model('Feedback', feedbackSchema);

// @desc    Submit feedback for a completed job
// @route   POST /api/v1/feedback/submit
// @access  Private (Client only)
export const submitFeedback = AsyncHandler(async (req, res) => {
  const { 
    jobId, 
    rating, 
    comment, 
    qualityRating, 
    timelinessRating, 
    communicationRating, 
    wouldRecommend 
  } = req.body;

  if (!jobId || !rating) {
    throw new ApiError(400, 'Job ID and rating are required');
  }

  if (rating < 1 || rating > 5) {
    throw new ApiError(400, 'Rating must be between 1 and 5');
  }

  // Verify job exists and belongs to the client
  const job = await JobRequest.findById(jobId).populate('clientId assignedProviderId');
  if (!job) {
    throw new ApiError(404, 'Job not found');
  }

  if (job.clientId._id.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'Not authorized to provide feedback for this job');
  }

  if (job.status !== 'closed' && job.status !== 'delivered') {
    throw new ApiError(400, 'Job must be completed to provide feedback');
  }

  // Check if feedback already exists
  const existingFeedback = await Feedback.findOne({ jobId, clientId: req.user._id });
  if (existingFeedback) {
    throw new ApiError(400, 'Feedback already submitted for this job');
  }

  // Create feedback
  const feedback = new Feedback({
    jobId,
    clientId: req.user._id,
    providerId: job.assignedProviderId._id,
    inspectorId: job.assignedInspectorId || null,
    rating,
    comment: comment?.trim(),
    qualityRating,
    timelinessRating,
    communicationRating,
    wouldRecommend: wouldRecommend || false,
    serviceCategory: job.serviceType || 'General',
    jobTitle: job.title,
    clientName: req.user.fullName,
    providerName: job.assignedProviderId.companyName || job.assignedProviderId.fullName,
    inspectorName: job.assignedInspectorId?.fullName || null
  });

  await feedback.save();

  // Update job with feedback status
  job.feedbackSubmitted = true;
  job.feedbackId = feedback._id;
  await job.save();

  res.status(201).json(
    new ApiResponse(201, feedback, 'Feedback submitted successfully')
  );
});

// @desc    Get feedback for inspector
// @route   GET /api/v1/feedback/inspector
// @access  Private (Inspector only)
export const getInspectorFeedback = AsyncHandler(async (req, res) => {
  const { page = 1, limit = 10, rating, search } = req.query;
  const inspectorId = req.user._id;

  const pageNumber = parseInt(page);
  const limitNumber = parseInt(limit);
  const skip = (pageNumber - 1) * limitNumber;

  // Build query
  const query = { 
    $or: [
      { inspectorId },
      { providerId: inspectorId } // In case inspector is also provider
    ]
  };

  if (rating && rating !== 'all') {
    query.rating = parseInt(rating);
  }

  if (search) {
    query.$and = [
      query.$and || {},
      {
        $or: [
          { jobTitle: { $regex: search, $options: 'i' } },
          { clientName: { $regex: search, $options: 'i' } },
          { comment: { $regex: search, $options: 'i' } }
        ]
      }
    ];
  }

  const feedbacks = await Feedback.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNumber);

  const total = await Feedback.countDocuments(query);

  res.status(200).json(
    new ApiResponse(200, {
      feedbacks,
      pagination: {
        currentPage: pageNumber,
        totalPages: Math.ceil(total / limitNumber),
        totalItems: total,
        itemsPerPage: limitNumber
      }
    }, 'Inspector feedback retrieved successfully')
  );
});

// @desc    Get feedback for service provider
// @route   GET /api/v1/feedback/provider
// @access  Private (Provider only)
export const getProviderFeedback = AsyncHandler(async (req, res) => {
  const { page = 1, limit = 10, rating, search, serviceType } = req.query;
  const providerId = req.user._id;

  const pageNumber = parseInt(page);
  const limitNumber = parseInt(limit);
  const skip = (pageNumber - 1) * limitNumber;

  const query = { providerId };

  if (rating && rating !== "all") {
    query.rating = parseInt(rating);
  }

  if (serviceType && serviceType !== "all") {
    query.serviceCategory = serviceType;
  }

  if (search?.trim()) {
    query.$or = [
      { jobTitle: { $regex: search, $options: "i" } },
      { clientName: { $regex: search, $options: "i" } },
      { comment: { $regex: search, $options: "i" } },
    ];
  }

  console.log("🔍 Final Query:", query);

  const feedbacks = await Feedback.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNumber);

  const total = await Feedback.countDocuments(query);

  res.status(200).json(
    new ApiResponse(
      200,
      {
        feedbacks,
        pagination: {
          currentPage: pageNumber,
          totalPages: Math.ceil(total / limitNumber),
          totalItems: total,
          itemsPerPage: limitNumber,
        },
      },
      "Provider feedback retrieved successfully"
    )
  );
});


// @desc    Get feedback for a specific job
// @route   GET /api/v1/feedback/job/:jobId
// @access  Private
export const getJobFeedback = AsyncHandler(async (req, res) => {
  const { jobId } = req.params;

  const feedback = await Feedback.findOne({ jobId })
    .populate('clientId', 'fullName email')
    .populate('providerId', 'fullName companyName')
    .populate('inspectorId', 'fullName email');

  if (!feedback) {
    throw new ApiError(404, 'No feedback found for this job');
  }

  // Check if user has permission to view this feedback
  const userId = req.user._id.toString();
  const hasPermission = 
    feedback.clientId._id.toString() === userId ||
    feedback.providerId._id.toString() === userId ||
    (feedback.inspectorId && feedback.inspectorId._id.toString() === userId);

  if (!hasPermission) {
    throw new ApiError(403, 'Not authorized to view this feedback');
  }

  res.status(200).json(
    new ApiResponse(200, feedback, 'Job feedback retrieved successfully')
  );
});

// @desc    Update feedback (client can edit within 24 hours)
// @route   PATCH /api/v1/feedback/:id
// @access  Private (Client only)
export const updateFeedback = AsyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rating, comment, qualityRating, timelinessRating, communicationRating, wouldRecommend } = req.body;

  const feedback = await Feedback.findById(id);
  if (!feedback) {
    throw new ApiError(404, 'Feedback not found');
  }

  // Check if feedback belongs to the client
  if (feedback.clientId.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'Not authorized to update this feedback');
  }

  // Check if feedback is within 24 hours
  const now = new Date();
  const feedbackDate = new Date(feedback.createdAt);
  const hoursDifference = (now - feedbackDate) / (1000 * 60 * 60);

  if (hoursDifference > 24) {
    throw new ApiError(400, 'Feedback can only be updated within 24 hours of submission');
  }

  // Update feedback
  if (rating) feedback.rating = rating;
  if (comment !== undefined) feedback.comment = comment.trim();
  if (qualityRating) feedback.qualityRating = qualityRating;
  if (timelinessRating) feedback.timelinessRating = timelinessRating;
  if (communicationRating) feedback.communicationRating = communicationRating;
  if (wouldRecommend !== undefined) feedback.wouldRecommend = wouldRecommend;

  await feedback.save();

  res.status(200).json(
    new ApiResponse(200, feedback, 'Feedback updated successfully')
  );
});

// @desc    Delete feedback (client can delete within 24 hours)
// @route   DELETE /api/v1/feedback/:id
// @access  Private (Client only)
export const deleteFeedback = AsyncHandler(async (req, res) => {
  const { id } = req.params;

  const feedback = await Feedback.findById(id);
  if (!feedback) {
    throw new ApiError(404, 'Feedback not found');
  }

  // Check if feedback belongs to the client
  if (feedback.clientId.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'Not authorized to delete this feedback');
  }

  // Check if feedback is within 24 hours
  const now = new Date();
  const feedbackDate = new Date(feedback.createdAt);
  const hoursDifference = (now - feedbackDate) / (1000 * 60 * 60);

  if (hoursDifference > 24) {
    throw new ApiError(400, 'Feedback can only be deleted within 24 hours of submission');
  }

  await feedback.deleteOne();

  // Update job to remove feedback reference
  await JobRequest.findByIdAndUpdate(feedback.jobId, {
    feedbackSubmitted: false,
    $unset: { feedbackId: 1 }
  });

  res.status(200).json(
    new ApiResponse(200, {}, 'Feedback deleted successfully')
  );
});

// @desc    Get feedback statistics for provider/inspector
// @route   GET /api/v1/feedback/stats
// @access  Private
export const getFeedbackStats = AsyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { role } = req.query; // 'provider' or 'inspector'

  let query;
  if (role === 'inspector') {
    query = { 
      $or: [
        { inspectorId: userId },
        { providerId: userId }
      ]
    };
  } else {
    query = { providerId: userId };
  }

  const feedbacks = await Feedback.find(query);

  const stats = {
    totalFeedbacks: feedbacks.length,
    averageRating: feedbacks.length > 0 
      ? feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length 
      : 0,
    ratingDistribution: Array.from({ length: 5 }, (_, i) => {
      const rating = i + 1;
      return {
        rating,
        count: feedbacks.filter(f => f.rating === rating).length
      };
    }),
    recentFeedbacks: feedbacks.filter(f => 
      new Date(f.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    ).length,
    positiveRatings: feedbacks.filter(f => f.rating >= 4).length
  };

  res.status(200).json(
    new ApiResponse(200, stats, 'Feedback statistics retrieved successfully')
  );
});

export { Feedback };
