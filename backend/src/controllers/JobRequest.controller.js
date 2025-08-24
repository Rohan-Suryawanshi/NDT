import { JobRequest } from "../models/JobRequest.model.js";
import { Service } from "../models/Service.model.js";
import { User } from "../models/User.model.js";
import { ServiceProviderProfile } from "../models/ServiceProviderProfile.model.js";
import { AsyncHandler } from "../utils/AsyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";
import { InspectorProfile } from "../models/InspectorProfile.model.js";

// @desc    Create a new job request
// @route   POST /api/v1/job-requests
// @access  Private (Client only)
export const createJobRequest = AsyncHandler(async (req, res) => {
  const {
    title,
    description,
    location,
    region,
    assignedProviderId,
    requiredServices,
    serviceQuantities,
    projectDuration,
    numInspectors,
    additionalCostFactors,
    costDetails,
    estimatedTotal,
    isPremium,
    urgencyLevel,
    preferredStartDate,
    expectedCompletionDate,
    complianceRequirements,
    paymentTerms,
    providerName,
    type
  } = req.body;




  if (
    !title ||
    !description ||
    !location ||
    !region ||
    !requiredServices ||
    !estimatedTotal ||
    !providerName
  ) {
    throw new ApiError(400, "All required fields must be filled");
  }

  // Verify provider exists if assigned
  let provider;
  if (assignedProviderId) {
     provider = await ServiceProviderProfile.findOne({
      userId: assignedProviderId,
    });
    if(!provider)
    {
      provider = await InspectorProfile.findOne({
        userId: assignedProviderId,
      });
    }

    if (!provider) {
      throw new ApiError(404, "Service provider not found");
    }
  }

  // Verify services exist
  const services = await Service.find({ _id: { $in: requiredServices } });
  if (services.length !== requiredServices.length) {
    throw new ApiError(400, "One or more services not found");
  }

  // Get client information
  const client = await User.findById(req.user._id).select("name email");
  if (!client) {
    throw new ApiError(404, "Client not found");
  }

 

  // Create job request
  const jobRequestData = {
    title,
    description,
    location,
    region,
    clientId: req.user._id,
    clientName: client.name,
    clientEmail: client.email,
    assignedProviderId,
    requiredServices,
    serviceQuantities: serviceQuantities || {},
    projectDuration: projectDuration || 1,
    numInspectors: numInspectors || 1,
    additionalCostFactors: additionalCostFactors || {},
    costDetails: costDetails || {},
    estimatedTotal,
    isPremium: isPremium || false,
    urgencyLevel: urgencyLevel || "medium",
    preferredStartDate: preferredStartDate
      ? new Date(preferredStartDate)
      : null,
    expectedCompletionDate: expectedCompletionDate
      ? new Date(expectedCompletionDate)
      : null,
    complianceRequirements: complianceRequirements || [],
    paymentTerms: paymentTerms || "on_completion",
    createdBy: req.user._id,
    status: "open",
    providerName,
    type:type||"provider"
  };

  const jobRequest = new JobRequest(jobRequestData);
  await jobRequest.save();

  // Populate references for response
  await jobRequest.populate([
    { path: "requiredServices", select: "name code description" },
    { path: "assignedProviderId", select: "name email" },
  ]);

  res
    .status(201)
    .json(new ApiResponse(201, jobRequest, "Job request created successfully"));
});

// @desc    Get all job requests with filtering and pagination
// @route   GET /api/v1/job-requests
// @access  Private
export const getAllJobRequests = AsyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    status,
    region,
    location,
    isPremium,
    urgencyLevel,
    dateFrom,
    dateTo,
    sortBy = "createdAt",
    sortOrder = "desc",
    search,
  } = req.query;

  // Build query
  let query = {};

  let profileExists = false;

  if (req.user.role === "client") {
    // Clients don't have separate profiles
    query.clientId = req.user._id;
    profileExists = true; // Assume client always has access
  } else if (req.user.role === "provider") {
    // Check if provider profile exists
    const providerProfile = await ServiceProviderProfile.findOne({
      userId: req.user._id,
    });
    if (providerProfile) {
      query.assignedProviderId = req.user._id;
      profileExists = true;
    }
  } else if (req.user.role === "inspector") {
    // Check if inspector profile exists
    const inspectorProfile = await InspectorProfile.findOne({
      userId: req.user._id,
    });
    if (inspectorProfile) {
      query.assignedProviderId = req.user._id;
      profileExists = true;
    }
  }

  // If not admin and no profile exists, throw error
  if (req.user.role !== "admin" && !profileExists) {
    throw new ApiError(404, "Create the Profile First");
  }


  // Admin can see all jobs

  // Apply filters
  if (status) query.status = status;
  if (region) query.region = region;
  if (location) query.location = new RegExp(location, "i");
  if (isPremium !== undefined) query.isPremium = isPremium === "true";
  if (urgencyLevel) query.urgencyLevel = urgencyLevel;

  // Date range filter
  if (dateFrom || dateTo) {
    query.createdAt = {};
    if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
    if (dateTo) query.createdAt.$lte = new Date(dateTo);
  }

  // Search functionality
  if (search) {
    query.$or = [
      { title: new RegExp(search, "i") },
      { description: new RegExp(search, "i") },
      { clientName: new RegExp(search, "i") },
    ];
  }

  // Calculate pagination
  const pageNumber = parseInt(page);
  const limitNumber = parseInt(limit);
  const skip = (pageNumber - 1) * limitNumber;
  // Execute query
  const jobRequests = await JobRequest.find(query)
    .populate("requiredServices", "name code")
    .populate("clientId", "fullName email")
    .populate("assignedProviderId", "name email")
    .populate("quotationHistory.providerId", "companyName email")
    .sort({ [sortBy]: sortOrder === "desc" ? -1 : 1 })
    .skip(skip)
    .limit(limitNumber);

  const totalJobs = await JobRequest.countDocuments(query);
  const totalPages = Math.ceil(totalJobs / limitNumber);


  res.status(200).json(
    new ApiResponse(
      200,
      {
        jobRequests,
        pagination: {
          currentPage: pageNumber,
          totalPages,
          totalJobs,
          hasNextPage: pageNumber < totalPages,
          hasPrevPage: pageNumber > 1,
        },
      },
      "Job requests retrieved successfully"
    )
  );
});
// @desc    Get job request by ID
// @route   GET /api/v1/job-requests/:id
// @access  Private
export const getJobRequestById = AsyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(400, "Invalid job request ID");
  }
  const jobRequest = await JobRequest.findById(id)
    .populate("requiredServices", "name code description")
    .populate("clientId", "name email")
    .populate("quotationHistory.providerId", "companyName email contactNumber")
    .populate("internalNotes.addedBy", "name")
    .populate("attachments.uploadedBy", "name");

  if (!jobRequest) {
    throw new ApiError(404, "Job request not found");
  }


  // Check authorization
  const isAuthorized =
    req.user.role === "admin" ||
    (req.user.role === "client" &&
      jobRequest.clientId._id.toString() === req.user._id.toString()) ||
    (req.user.role === "provider" &&
      jobRequest.assignedProviderId?._id.toString() ===
        req.user._id.toString());

  if (!isAuthorized) {
    throw new ApiError(403, "Not authorized to view this job request");
  }

  res
    .status(200)
    .json(
      new ApiResponse(200, jobRequest, "Job request retrieved successfully")
    );
});
// @desc    Update job request
// @route   PUT /api/v1/job-requests/:id
// @access  Private
export const updateJobRequest = AsyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(400, "Invalid job request ID");
  }

  const jobRequest = await JobRequest.findById(id);
  if (!jobRequest) {
    throw new ApiError(404, "Job request not found");
  }

  // Check authorization
  const isAuthorized =
    req.user.role === "admin" ||
    (req.user.role === "client" &&
      jobRequest.clientId.toString() === req.user._id.toString());

  if (!isAuthorized) {
    throw new ApiError(403, "Not authorized to update this job request");
  }

  // Prevent updates if job is in certain statuses
  const nonEditableStatuses = ["completed", "delivered", "closed", "cancelled"];
  if (nonEditableStatuses.includes(jobRequest.status)) {
    throw new ApiError(
      400,
      `Cannot update job request in ${jobRequest.status} status`
    );
  }

  // Update allowed fields
  const allowedUpdates = [
    "title",
    "description",
    "location",
    "region",
    "requiredServices",
    "serviceQuantities",
    "projectDuration",
    "numInspectors",
    "additionalCostFactors",
    "costDetails",
    "estimatedTotal",
    "preferredStartDate",
    "expectedCompletionDate",
    "complianceRequirements",
    "paymentTerms",
  ];

  const updates = {};
  allowedUpdates.forEach((field) => {
    if (req.body[field] !== undefined) {
      if (
        field === "preferredStartDate" ||
        field === "expectedCompletionDate"
      ) {
        updates[field] = new Date(req.body[field]);
      } else {
        updates[field] = req.body[field];
      }
    }
  });

  updates.lastModifiedBy = req.user._id;

  const updatedJobRequest = await JobRequest.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true,
  }).populate([
    { path: "requiredServices", select: "name code description" },
    { path: "assignedProviderId", select: "fullName email" },
  ]);

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedJobRequest,
        "Job request updated successfully"
      )
    );
});
// @desc    Delete job request
// @route   DELETE /api/v1/job-requests/:id
// @access  Private (Client/Admin only)
export const deleteJobRequest = AsyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(400, "Invalid job request ID");
  }

  const jobRequest = await JobRequest.findById(id);
  if (!jobRequest) {
    throw new ApiError(404, "Job request not found");
  }

  // Check authorization
  const isAuthorized =
    req.user.role === "admin" ||
    (req.user.role === "client" &&
      jobRequest.clientId.toString() === req.user._id.toString());

  if (!isAuthorized) {
    throw new ApiError(403, "Not authorized to delete this job request");
  }

  // Prevent deletion if job is in progress
  const nonDeletableStatuses = ["in_progress", "completed", "delivered"];
  if (nonDeletableStatuses.includes(jobRequest.status)) {
    throw new ApiError(
      400,
      `Cannot delete job request in ${jobRequest.status} status`
    );
  }

  await JobRequest.findByIdAndDelete(id);

  res
    .status(200)
    .json(new ApiResponse(200, null, "Job request deleted successfully"));
});
// @desc    Update job request status
// @route   PATCH /api/v1/job-requests/:id/status
// @access  Private
export const updateJobStatus = AsyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, reason } = req.body;


  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(400, "Invalid job request ID");
  }

  const jobRequest = await JobRequest.findById(id);
  if (!jobRequest) {
    throw new ApiError(404, "Job request not found");
  }

  // Check authorization based on status change
  let isAuthorized = false;
  if (req.user.role === "admin") {
    isAuthorized = true;
  } else if (
    req.user.role === "client" &&
    jobRequest.clientId.toString() === req.user._id.toString()
  ) {
    // Clients can move to: cancelled, accepted, disputed, on_hold, closed
    isAuthorized = [
      "cancelled",
      "accepted",
      "disputed",
      "on_hold",
      "closed",
    ].includes(status);
  } else if (
    (req.user.role === "provider" || req.user.role === "inspector") &&
    jobRequest.assignedProviderId?.toString() === req.user._id.toString()
  ) {
    // Providers and Inspectors can move to: quoted, rejected, negotiating, in_progress, completed, delivered, disputed, on_hold, closed
    isAuthorized = [
      "quoted",
      "rejected",
      "negotiating",
      "in_progress",
      "completed",
      "delivered",
      "disputed",
      "on_hold",
      "closed",
      "accepted",
    ].includes(status);
  }

  if (!isAuthorized) {
    throw new ApiError(403, "Not authorized to update job status");
  }

  try {
    await jobRequest.updateStatus(status, req.user._id);
    // If status is "accepted", update the accepted quotation in quotationHistory
    if (status === "accepted" && jobRequest.finalQuotationId) {
      const acceptedQuotation = jobRequest.quotationHistory.id(jobRequest.finalQuotationId);
      if (acceptedQuotation) {
      acceptedQuotation.status = "accepted";

      }
      await jobRequest.save();
    }
 
    // Add internal note for status change
    if (reason) {
      jobRequest.internalNotes.push({
        note: `Status changed to ${status}. Reason: ${reason}`,
        addedBy: req.user._id,
        noteType: "general",
      });
      await jobRequest.save();
    }

    // Update timeline fields based on status
    const now = new Date();
    if (status === "in_progress" && !jobRequest.actualStartDate) {
      jobRequest.actualStartDate = now;
    } else if (status === "completed" && !jobRequest.actualCompletionDate) {
      jobRequest.actualCompletionDate = now;
    }

    await jobRequest.save();

    const updatedJobRequest = await jobRequest.populate(
      "assignedProviderId",
      "fullName"
    );

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          updatedJobRequest,
          "Job status updated successfully"
        )
      );
  } catch (error) {
    throw new ApiError(400, error.message);
  }
});
// @desc    Add quotation to job request
// @route   POST /api/v1/job-requests/:id/quotations
// @access  Private (Provider only)
export const addQuotation = AsyncHandler(async (req, res) => {
  const { id } = req.params;
  const { amount, quotationDetails, validUntil, attachments } = req.body;


  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(400, "Invalid job request ID");
  }

  const jobRequest = await JobRequest.findById(id);
  if (!jobRequest) {
    throw new ApiError(404, "Job request not found");
  }

  // Check authorization - only assigned provider can quote
  if (
    req.user.role !== "provider" ||
    jobRequest.assignedProviderId?.toString() !== req.user._id.toString()
  ) {
    throw new ApiError(403, "Not authorized to add quotation");
  }

  // Check if job is in quotable status
  if (!["open", "negotiating"].includes(jobRequest.status)) {
    throw new ApiError(400, "Cannot add quotation to job in current status");
  }

  // Validate quotedAmount
  if (amount === undefined || amount === null || amount === "") {
    throw new ApiError(400, "Quoted amount is required");
  }

  const quotationData = {
    providerId: req.user._id,
    quotedAmount: amount,
    quotationDetails,
    validUntil: validUntil ? new Date(validUntil) : null,
    attachments: attachments || [],
  };

  try {
    await jobRequest.addQuotation(quotationData);

    const updatedJobRequest = await JobRequest.findById(id);

    // .populate("quotationHistory.providerId", "clientName")
    //   .populate("assignedProviderId", "name email");

    res
      .status(201)
      .json(
        new ApiResponse(201, updatedJobRequest, "Quotation added successfully")
      );
  } catch (error) {
    throw new ApiError(400, error.message);
  }
});
// @desc    Get quotation history for a job
// @route   GET /api/v1/job-requests/:id/quotations
// @access  Private
export const getQuotationHistory = AsyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(400, "Invalid job request ID");
  }

  const jobRequest = await JobRequest.findById(id);
  // .populate("quotationHistory.providerId", "fullName email")
  // .select("quotationHistory clientId assignedProviderId");


  if (!jobRequest) {
    throw new ApiError(404, "Job request not found");
  }

  // Check authorization
  const isAuthorized =
    req.user.role === "admin" ||
    (req.user.role === "client" &&
      jobRequest.clientId.toString() === req.user._id.toString()) ||
    (req.user.role === "provider" &&
      jobRequest.assignedProviderId?.toString() === req.user._id.toString());

  if (!isAuthorized) {
    throw new ApiError(403, "Not authorized to view quotations");
  }

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { quotations: jobRequest.quotationHistory },
        "Quotation history retrieved successfully"
      )
    );
});
// @desc    Add internal note to job request
// @route   POST /api/v1/job-requests/:id/notes
// @access  Private
export const addInternalNote = AsyncHandler(async (req, res) => {
  const { id } = req.params;
  const { content, noteType = "general" } = req.body;

  

  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(400, "Invalid job request ID");
  }

  if (!content || content.trim().length === 0) {
    throw new ApiError(400, "Note content is required");
  }

  const jobRequest = await JobRequest.findById(id);
  if (!jobRequest) {
    throw new ApiError(404, "Job request not found");
  }

 

  // Check authorization
  const isAuthorized =
    req.user.role === "admin" ||
    (req.user.role === "client" &&
      jobRequest.clientId.toString() === req.user._id.toString()) ||
    (req.user.role === "provider" &&
      jobRequest.assignedProviderId?.toString() === req.user._id.toString()) ||
    (req.user.role === "inspector" &&
      jobRequest.assignedProviderId?.toString() === req.user._id.toString());

  if (!isAuthorized) {
    throw new ApiError(403, "Not authorized to add notes");
  }

  jobRequest.internalNotes.push({
    note: content.trim(),
    addedBy: req.user._id,
    noteType,
  });

  await jobRequest.save();

  const updatedJobRequest = await JobRequest.findById(id)
    .populate("internalNotes.addedBy", "fullName")
    .select("internalNotes");

  res
    .status(201)
    .json(
      new ApiResponse(
        201,
        { notes: updatedJobRequest.internalNotes },
        "Internal note added successfully"
      )
    );
});

// @desc    Add file attachment to job request
// @route   POST /api/v1/job-requests/:id/attachments
// @access  Private
export const addAttachment = AsyncHandler(async (req, res) => {
  const { id } = req.params;
  const { category = "other" } = req.body;
  const file = req.file; // Assuming file is uploaded via multer middleware

  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(400, "Invalid job request ID");
  }

  if (!file) {
    throw new ApiError(400, "No file uploaded");
  }

  const jobRequest = await JobRequest.findById(id);
  if (!jobRequest) {
    throw new ApiError(404, "Job request not found");
  }

  // Check authorization
  const isAuthorized =
    req.user.role === "admin" ||
    (req.user.role === "client" &&
      jobRequest.clientId.toString() === req.user._id.toString()) ||
    (req.user.role === "provider" &&
      jobRequest.assignedProviderId?.toString() === req.user._id.toString()) ||
    (req.user.role === "inspector" &&
      jobRequest.assignedProviderId?.toString() === req.user._id.toString());

  if (!isAuthorized) {
    throw new ApiError(403, "Not authorized to add attachments");
  }

  // Upload to Cloudinary
  const cloudinaryResult = await cloudinary.uploader.upload(file.path, {
    resource_type: "auto",
    folder: "job_attachments",
  });

  jobRequest.attachments.push({
    fileName: cloudinaryResult.public_id,
    originalFileName: file.originalname,
    fileUrl: cloudinaryResult.secure_url,
    fileType: cloudinaryResult.format || file.mimetype || "unknown",
    fileSize: file.size,
    uploadedBy: req.user._id,
    category,
  });

  await jobRequest.save();

  const updatedJobRequest = await JobRequest.findById(id)
    .populate("attachments.uploadedBy", "fullName")
    .select("attachments");

  res
    .status(201)
    .json(
      new ApiResponse(
        201,
        { attachments: updatedJobRequest.attachments },
        "Attachment added successfully"
      )
    );
});

// @desc    Get job request statistics
// @route   GET /api/v1/job-requests/stats
// @access  Private
export const getJobRequestStats = AsyncHandler(async (req, res) => {
  let matchStage = {};

  // Role-based filtering
  if (req.user.role === "client") {
    matchStage.clientId = new mongoose.Types.ObjectId(req.user._id);
  } else if (req.user.role === "provider") {
    matchStage.assignedProviderId = new mongoose.Types.ObjectId(req.user._id);
  }

  const stats = await JobRequest.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalJobs: { $sum: 1 },
        openJobs: { $sum: { $cond: [{ $eq: ["$status", "open"] }, 1, 0] } },
        inProgressJobs: {
          $sum: { $cond: [{ $eq: ["$status", "in_progress"] }, 1, 0] },
        },
        completedJobs: {
          $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
        },
        totalValue: { $sum: "$estimatedTotal" },
        averageValue: { $avg: "$estimatedTotal" },
        premiumJobs: { $sum: { $cond: ["$isPremium", 1, 0] } },
      },
    },
  ]);

  const statusBreakdown = await JobRequest.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  const regionBreakdown = await JobRequest.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: "$region",
        count: { $sum: 1 },
        totalValue: { $sum: "$estimatedTotal" },
      },
    },
  ]);

  res.status(200).json(
    new ApiResponse(
      200,
      {
        overview: stats[0] || {
          totalJobs: 0,
          openJobs: 0,
          inProgressJobs: 0,
          completedJobs: 0,
          totalValue: 0,
          averageValue: 0,
          premiumJobs: 0,
        },
        statusBreakdown,
        regionBreakdown,
      },
      "Job request statistics retrieved successfully"
    )
  );
});

// @desc    Get jobs by provider (for provider dashboard)
// @route   GET /api/v1/job-requests/provider/:providerId
// @access  Private (Provider/Admin only)
export const getJobsByProvider = AsyncHandler(async (req, res) => {
  const { providerId } = req.params;
  const { status, region, isPremium, dateFrom, dateTo } = req.query;

  // Check authorization
  if (req.user.role !== "admin" && req.user._id.toString() !== providerId) {
    throw new ApiError(403, "Not authorized to view these jobs");
  }

  const filters = { status, region, isPremium, dateFrom, dateTo };
  const jobs = await JobRequest.findByProvider(providerId, filters);

  res
    .status(200)
    .json(
      new ApiResponse(200, { jobs }, "Provider jobs retrieved successfully")
    );
});

// @desc    Get jobs by client (for client dashboard)
// @route   GET /api/v1/job-requests/client/:clientId
// @access  Private (Client/Admin only)
export const getJobsByClient = AsyncHandler(async (req, res) => {
  const { clientId } = req.params;
  const { status, region } = req.query;

  // Check authorization
  if (req.user.role !== "admin" && req.user._id.toString() !== clientId) {
    throw new ApiError(403, "Not authorized to view these jobs");
  }

  const filters = { status, region };
  const jobs = await JobRequest.findByClient(clientId, filters);

  res
    .status(200)
    .json(new ApiResponse(200, { jobs }, "Client jobs retrieved successfully"));
});
// @desc    Update quotation status (accept/reject by client)
// @route   PATCH /api/v1/job-requests/:id/quotations/:quotationId
// @access  Private (Client only)
export const updateQuotationStatus = AsyncHandler(async (req, res) => {
  const { id, quotationId } = req.params;
  const { status, clientMessage } = req.body;

  if (!["accepted", "rejected", "negotiating"].includes(status)) {
    throw new ApiError(400, "Invalid quotation status");
  }

  const jobRequest = await JobRequest.findById(id);
  if (!jobRequest) {
    throw new ApiError(404, "Job request not found");
  }

  // Check if user is the client who created this request
  if (jobRequest.clientId.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Not authorized to update this quotation");
  }

  // Find and update the quotation
  const quotation = jobRequest.quotationHistory.id(quotationId);
  if (!quotation) {
    throw new ApiError(404, "Quotation not found");
  }

  quotation.status = status;
  if (clientMessage) {
    quotation.clientResponse = {
      message: clientMessage,
      respondedAt: new Date(),
      respondedBy: req.user._id,
    };
  }

  // Update job request status based on quotation acceptance
  if (status === "accepted") {
    jobRequest.status = "accepted";
    jobRequest.finalQuotationId = quotationId;
    jobRequest.estimatedTotal = quotation.quotedAmount;
  } else if (status === "negotiating") {
    jobRequest.status = "negotiating";
  }

  await jobRequest.save();

  const updatedJobRequest = await JobRequest.findById(id)
    .populate("requiredServices", "name code")
    .populate("clientId", "fullName email")
    .populate("assignedProviderId", "name email");

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedJobRequest,
        `Quotation ${status} successfully`
      )
    );
});

// @desc    Add negotiation message to quotation
// @route   POST /api/v1/job-requests/:id/quotations/:quotationId/negotiate
// @access  Private (Client/Provider)
export const addNegotiationMessage = AsyncHandler(async (req, res) => {
  const { id, quotationId } = req.params;
  const { message, proposedAmount, counterOffer } = req.body;

  if (!message || message.trim() === "") {
    throw new ApiError(400, "Message is required for negotiation");
  }

  const jobRequest = await JobRequest.findById(id);
  if (!jobRequest) {
    throw new ApiError(404, "Job request not found");
  }

  const quotation = jobRequest.quotationHistory.id(quotationId);
  if (!quotation) {
    throw new ApiError(404, "Quotation not found");
  }

  // Check authorization - either client or the provider who submitted the quotation
  const isClient = jobRequest.clientId.toString() === req.user._id.toString();
  const isProvider =
    quotation.providerId.toString() === req.user._id.toString();

  if (!isClient && !isProvider) {
    throw new ApiError(403, "Not authorized to negotiate this quotation");
  }

  // Initialize negotiations array if it doesn't exist
  if (!quotation.negotiations) {
    quotation.negotiations = [];
  }

  // Add negotiation message
  quotation.negotiations.push({
    message: message.trim(),
    proposedAmount: proposedAmount ? parseFloat(proposedAmount) : null,
    counterOffer: counterOffer || null,
    fromClient: isClient,
    createdBy: req.user._id,
    createdAt: new Date(),
  });

  quotation.status = "negotiating";
  jobRequest.status = "negotiating";

  await jobRequest.save();

  const updatedJobRequest = await JobRequest.findById(id)
    .populate("requiredServices", "name code")
    .populate("clientId", "fullName email")
    .populate("assignedProviderId", "name email");

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedJobRequest,
        "Negotiation message sent successfully"
      )
    );
});

// @desc    Generate PDF report for completed job
// @route   GET /api/v1/job-requests/:id/report
// @access  Private (Client only - must have paid)
export const generateJobReport = AsyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(400, "Invalid job request ID");
  }

  const jobRequest = await JobRequest.findById(id)
    .populate("requiredServices", "name code description")
    .populate("clientId", "fullName email")
    .populate("assignedProviderId", "name email")
    .populate("internalNotes.addedBy", "fullName");

  if (!jobRequest) {
    throw new ApiError(404, "Job request not found");
  }

  // Check authorization
  if (
    req.user.role !== "admin" &&
    jobRequest.clientId._id.toString() !== req.user._id.toString()
  ) {
    throw new ApiError(403, "Not authorized to access this report");
  }

  // Check if job is completed and payment is made
  if (jobRequest.status !== "closed") {
    throw new ApiError(400, "Report only available for completed jobs");
  }

  if (jobRequest.paymentStatus !== "paid") {
    throw new ApiError(402, "Payment required to access report");
  }

  // Generate PDF report (simplified version - you can enhance this)
  const reportData = {
    jobId: jobRequest._id,
    title: jobRequest.title,
    description: jobRequest.description,
    client: jobRequest.clientId,
    provider: jobRequest.assignedProviderId,
    location: jobRequest.location,
    region: jobRequest.region,
    services: jobRequest.requiredServices,
    status: jobRequest.status,
    createdAt: jobRequest.createdAt,
    completedAt: jobRequest.actualCompletionDate,
    estimatedTotal: jobRequest.estimatedTotal,
    finalAmount: jobRequest.finalQuotedAmount,
    notes: jobRequest.internalNotes,
    attachments: jobRequest.attachments,
    rating: jobRequest.clientRating || null
  };

  // For demo purposes, return JSON. In production, generate actual PDF
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="job-report-${id}.json"`);
  
  res.status(200).json(
    new ApiResponse(200, reportData, "Job report generated successfully")
  );
});

// @desc    Add client rating for completed job
// @route   POST /api/v1/job-requests/:id/rating
// @access  Private (Client only)
export const addClientRating = AsyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rating, review } = req.body;

  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(400, "Invalid job request ID");
  }

  if (!rating || rating < 1 || rating > 5) {
    throw new ApiError(400, "Rating must be between 1 and 5");
  }

  const jobRequest = await JobRequest.findById(id);
  if (!jobRequest) {
    throw new ApiError(404, "Job request not found");
  }

  // Check authorization
  if (
    req.user.role !== "admin" &&
    jobRequest.clientId.toString() !== req.user._id.toString()
  ) {
    throw new ApiError(403, "Not authorized to rate this job");
  }

  // Check if job is completed and payment is made
  if (jobRequest.status !== "closed") {
    throw new ApiError(400, "Can only rate completed jobs");
  }

  if (jobRequest.paymentStatus !== "paid") {
    throw new ApiError(400, "Payment required to submit rating");
  }

  // Check if rating already exists
  if (jobRequest.clientRating && jobRequest.clientRating.rating) {
    throw new ApiError(400, "Rating already submitted for this job");
  }

  // Add rating to job request
  jobRequest.clientRating = {
    rating: parseInt(rating),
    review: review ? review.trim() : "",
    submittedAt: new Date(),
    submittedBy: req.user._id
  };

  await jobRequest.save();

  // Update provider's profile rating
  if (jobRequest.assignedProviderId) {
    try {
      // Try to find ServiceProvider profile first
      let providerProfile = await ServiceProviderProfile.findOne({
        userId: jobRequest.assignedProviderId
      });

      // If not found, try Inspector profile
      if (!providerProfile) {
        providerProfile = await InspectorProfile.findOne({
          userId: jobRequest.assignedProviderId
        });
      }

      if (providerProfile) {
        // Update rating statistics
        const newTotalRatings = providerProfile.totalRatings + 1;
        const newRatingSum = providerProfile.ratingSum + parseInt(rating);
        const newAverageRating = newRatingSum / newTotalRatings;

        providerProfile.totalRatings = newTotalRatings;
        providerProfile.ratingSum = newRatingSum;
        providerProfile.rating = Math.round(newAverageRating * 100) / 100; // Round to 2 decimal places

        await providerProfile.save();
      }
    } catch (error) {
      console.error("Error updating provider rating:", error);
      // Don't throw error here to avoid affecting the main rating submission
    }
  }

  const updatedJobRequest = await JobRequest.findById(id)
    .populate("clientId", "fullName")
    .populate("assignedProviderId", "name")
    .select("clientRating title status");

  res.status(200).json(
    new ApiResponse(200, updatedJobRequest, "Rating submitted successfully")
  );
});

// @desc    Get job statistics for client dashboard
// @route   GET /api/v1/job-requests/client-stats
// @access  Private (Client only)
export const getClientJobStats = AsyncHandler(async (req, res) => {
  const clientId = req.user._id;

  const stats = await JobRequest.aggregate([
    { $match: { clientId: clientId } },
    {
      $group: {
        _id: null,
        totalJobs: { $sum: 1 },
        completedJobs: {
          $sum: { $cond: [{ $eq: ["$status", "closed"] }, 1, 0] }
        },
        inProgressJobs: {
          $sum: { $cond: [{ $eq: ["$status", "in_progress"] }, 1, 0] }
        },
        totalSpent: {
          $sum: { $cond: [{ $eq: ["$paymentStatus", "paid"] }, "$paymentAmount", 0] }
        },
        averageRating: {
          $avg: "$clientRating.rating"
        }
      }
    }
  ]);

  const result = stats[0] || {
    totalJobs: 0,
    completedJobs: 0,
    inProgressJobs: 0,
    totalSpent: 0,
    averageRating: 0
  };

  res.status(200).json(
    new ApiResponse(200, result, "Client statistics retrieved successfully")
  );
});
