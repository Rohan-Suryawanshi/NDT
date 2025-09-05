import { InspectorProfile } from "../models/InspectorProfile.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { AsyncHandler } from "../utils/AsyncHandler.js";
import { uploadToCloudinary, destroyImage } from "../utils/Cloudinary.js";
import fs from "fs";
import axios from "axios";
import qs from "qs";

// Twilio Configuration
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

// Temporary storage for OTPs (in production, use Redis or database with expiry)
const inspectorOtpStore = new Map();
const inspectorVerifiedPhones = new Map(); // Store verified phone numbers temporarily

// Generate random 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP via Twilio for Inspector
const sendInspectorOTP = AsyncHandler(async (req, res) => {
  const { contactNumber } = req.body;
  
  if (!contactNumber) {
    throw new ApiError(400, "Contact number is required");
  }

  // Validate phone number format (basic validation)
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  if (!phoneRegex.test(contactNumber)) {
    throw new ApiError(400, "Invalid phone number format");
  }

  const otp = generateOTP();
  
  // Store OTP with 5-minute expiry
  inspectorOtpStore.set(contactNumber, {
    otp,
    timestamp: Date.now(),
    expiresAt: Date.now() + 5 * 60 * 1000 // 5 minutes
  });

  try {
    const data = qs.stringify({
      'From': TWILIO_PHONE_NUMBER,
      'To': contactNumber,
      'Body': `Your Verification Code is ${otp}. This code will expire in 5 minutes.`
    });

    const config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
      headers: { 
        'Content-Type': 'application/x-www-form-urlencoded', 
        'Authorization': `Basic ${Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64')}`
      },
      data: data
    };

    const response = await axios.request(config);
    
    res.status(200).json(
      new ApiResponse(200, { messageSid: response.data.sid }, "OTP sent successfully")
    );
  } catch (error) {
    console.error("Twilio SMS Error:", error.response?.data || error.message);
    throw new ApiError(500, "Failed to send OTP");
  }
});

// Verify OTP for Inspector
const verifyInspectorOTP = AsyncHandler(async (req, res) => {
  const { contactNumber, otp } = req.body;
  
  if (!contactNumber || !otp) {
    throw new ApiError(400, "Contact number and OTP are required");
  }

  const storedOtpData = inspectorOtpStore.get(contactNumber);
  
  if (!storedOtpData) {
    throw new ApiError(400, "OTP not found or expired");
  }

  if (Date.now() > storedOtpData.expiresAt) {
    inspectorOtpStore.delete(contactNumber);
    throw new ApiError(400, "OTP has expired");
  }

  if (storedOtpData.otp !== otp) {
    throw new ApiError(400, "Invalid OTP");
  }

  // OTP verified successfully, remove from store
  inspectorOtpStore.delete(contactNumber);
  
  // Mark phone as verified for the user
  inspectorVerifiedPhones.set(`${req.user._id}-${contactNumber}`, {
    verified: true,
    timestamp: Date.now(),
    expiresAt: Date.now() + 10 * 60 * 1000 // 10 minutes to complete profile
  });
  
  res.status(200).json(
    new ApiResponse(200, { verified: true }, "OTP verified successfully")
  );
});

// Utility: Delete temp file
const deleteLocalFile = (filePath) => {
  if (fs.existsSync(filePath)) {
    fs.unlink(filePath, (err) => {
      if (err) console.error("❌ Error deleting file:", err);
    });
  }
};

// ✅ CREATE or UPDATE (Upsert) Inspector Profile
const upsertInspectorProfile = AsyncHandler(async (req, res) => {
  const userId = req.user._id;
  const {
    fullName,
    contactNumber,
    associationType,
    companyName,
    hourlyRate,
    monthlyRate,
    acceptedTerms,
    certificateExpiryAlerts,
    matchingJobEmailAlerts,
    certifications,
    latitude,
    longitude,
  } = req.body;

  // Validation
  if (!fullName) {
    throw new ApiError(400, "Full name is required");
  }
  if (!contactNumber) {
    throw new ApiError(400, "Contact number is required");
  }

  // Check if phone number is verified
  const verificationKey = `${userId}-${contactNumber}`;
  const verificationData = inspectorVerifiedPhones.get(verificationKey);
  
  if (!verificationData || Date.now() > verificationData.expiresAt) {
    inspectorVerifiedPhones.delete(verificationKey);
    throw new ApiError(400, "Phone number must be verified before saving profile");
  }

  if (!associationType) {
    throw new ApiError(400, "Association type is required");
  }
  if (associationType === "Company Employee" && !companyName) {
    throw new ApiError(400, "Company name is required for company employees");
  }

  const resumeFile = req.file;
  let resumeData;

  // Handle resume upload
  if (resumeFile) {
    const resumeResult = await uploadToCloudinary(resumeFile.path);
    if (!resumeResult.url) {
      throw new ApiError(500, "Failed to upload resume");
    }
    resumeData = {
      url: resumeResult.url,
      uploadedAt: new Date(),
    };
    deleteLocalFile(resumeFile.path);
  }

  // Parse certifications if provided as string
  let parsedCertifications;
  if (certifications) {
    try {
      parsedCertifications =
        typeof certifications === "string"
          ? JSON.parse(certifications)
          : certifications;
    } catch (error) {
      throw new ApiError(400, "Invalid certifications format");
    }
  }

  const updateData = {
    fullName,
    contactNumber,
    associationType,
    ...(companyName && { companyName }),
    ...(hourlyRate && { hourlyRate: Number(hourlyRate) }),
    ...(monthlyRate && { monthlyRate: Number(monthlyRate) }),
    ...(acceptedTerms !== undefined && {
      acceptedTerms: Boolean(acceptedTerms),
    }),
    ...(certificateExpiryAlerts !== undefined && {
      certificateExpiryAlerts: Boolean(certificateExpiryAlerts),
    }),
    ...(matchingJobEmailAlerts !== undefined && {
      matchingJobEmailAlerts: Boolean(matchingJobEmailAlerts),
    }),
    ...(parsedCertifications && { certifications: parsedCertifications }),
    ...(resumeData && { resume: resumeData }),
    ...(latitude !== undefined && { latitude: Number(latitude) }),
    ...(longitude !== undefined && { longitude: Number(longitude) }),
  };

  const profile = await InspectorProfile.findOneAndUpdate(
    { userId },
    updateData,
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).populate("userId", "name email avatar isVerified");

  // Clean up verification data after successful profile save
  inspectorVerifiedPhones.delete(`${userId}-${contactNumber}`);

  res
    .status(200)
    .json(
      new ApiResponse(200, profile, "Inspector profile saved successfully")
    );
});

// ✅ GET My Inspector Profile
const getInspectorProfile = AsyncHandler(async (req, res) => {
  const userId = req.user._id;

  const profile = await InspectorProfile.findOne({ userId })
    .populate("userId", "name email avatar isVerified")
    // .populate("jobHistory.jobId")
    // .populate("jobHistory.clientId", "name email avatar");

  if (!profile) {
    throw new ApiError(404, "Inspector profile not found");
  }

  res
    .status(200)
    .json(
      new ApiResponse(200, profile, "Inspector profile fetched successfully")
    );
});

// ✅ GET Inspector Profile by ID (Public)
const getInspectorById = AsyncHandler(async (req, res) => {
  const { inspectorId } = req.params;

  const profile = await InspectorProfile.findById(inspectorId)
    .populate("userId", "name email avatar isVerified")
    .select("-payouts -totalEarnings"); // Hide sensitive data

  if (!profile) {
    throw new ApiError(404, "Inspector profile not found");
  }

  res
    .status(200)
    .json(
      new ApiResponse(200, profile, "Inspector profile fetched successfully")
    );
});

// ✅ UPDATE Inspector Location
const updateInspectorLocation = AsyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { latitude, longitude } = req.body;

  // Validation
  if (latitude === undefined || longitude === undefined) {
    throw new ApiError(400, "Both latitude and longitude are required");
  }

  if (latitude < -90 || latitude > 90) {
    throw new ApiError(400, "Latitude must be between -90 and 90");
  }

  if (longitude < -180 || longitude > 180) {
    throw new ApiError(400, "Longitude must be between -180 and 180");
  }

  const profile = await InspectorProfile.findOneAndUpdate(
    { userId },
    { 
      latitude: Number(latitude), 
      longitude: Number(longitude) 
    },
    { new: true, upsert: true }
  ).populate("userId", "name email avatar isVerified");

  if (!profile) {
    throw new ApiError(404, "Inspector profile not found");
  }

  res
    .status(200)
    .json(
      new ApiResponse(200, profile, "Inspector location updated successfully")
    );
});

// ✅ GET All Inspector Profiles (with filters and pagination)
const getAllInspectors = AsyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    associationType,
    availability,
    verified,
    subscriptionPlan,
    minRating,
    maxHourlyRate,
    minHourlyRate,
    maxMonthlyRate,
    minMonthlyRate,
    search,
    sortBy = "rating",
    sortOrder = "desc",
  } = req.query;

  // Build filter object
  const filter = {};

  if (associationType) {
    filter.associationType = associationType;
  }

  if (availability !== undefined) {
    filter.availability = availability === "true";
  }

  if (verified !== undefined) {
    filter.verified = verified === "true";
  }

  if (subscriptionPlan) {
    filter.subscriptionPlan = subscriptionPlan;
  }

  if (minRating) {
    filter.rating = { ...filter.rating, $gte: Number(minRating) };
  }

  if (minHourlyRate) {
    filter.hourlyRate = { ...filter.hourlyRate, $gte: Number(minHourlyRate) };
  }

  if (maxHourlyRate) {
    filter.hourlyRate = { ...filter.hourlyRate, $lte: Number(maxHourlyRate) };
  }

  if (minMonthlyRate) {
    filter.monthlyRate = {
      ...filter.monthlyRate,
      $gte: Number(minMonthlyRate),
    };
  }

  if (maxMonthlyRate) {
    filter.monthlyRate = {
      ...filter.monthlyRate,
      $lte: Number(maxMonthlyRate),
    };
  }

  if (search) {
    filter.$or = [
      { fullName: { $regex: search, $options: "i" } },
      { companyName: { $regex: search, $options: "i" } },
      { "certifications.certificationBody": { $regex: search, $options: "i" } },
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === "asc" ? 1 : -1;

  const [profiles, total] = await Promise.all([
    InspectorProfile.find(filter)
      .populate("userId", "name email avatar isVerified")
      .select("-payouts -totalEarnings") // Hide sensitive data
      .skip(skip)
      .limit(parseInt(limit))
      .sort(sort),
    InspectorProfile.countDocuments(filter),
  ]);

  const pagination = {
    currentPage: parseInt(page),
    totalPages: Math.ceil(total / parseInt(limit)),
    totalRecords: total,
    hasNext: parseInt(page) < Math.ceil(total / parseInt(limit)),
    hasPrev: parseInt(page) > 1,
  };

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { profiles, pagination },
        "Inspector profiles fetched successfully"
      )
    );
});

// ✅ UPDATE Inspector Availability
const updateAvailability = AsyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { availability } = req.body;

  if (typeof availability !== "boolean") {
    throw new ApiError(400, "Availability must be a boolean value");
  }

  const profile = await InspectorProfile.findOneAndUpdate(
    { userId },
    { availability },
    { new: true }
  ).populate("userId", "name email avatar isVerified");

  if (!profile) {
    throw new ApiError(404, "Inspector profile not found");
  }

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        profile,
        `Availability ${availability ? "enabled" : "disabled"} successfully`
      )
    );
});

// ✅ UPDATE Inspector Rates
const updateRates = AsyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { hourlyRate, monthlyRate, marginRate,currency } = req.body;


  const updateData = {};
  if (hourlyRate !== undefined) updateData.hourlyRate = Number(hourlyRate);
  if (monthlyRate !== undefined) updateData.monthlyRate = Number(monthlyRate);
  if (marginRate !== undefined) updateData.marginRate = Number(marginRate);

  if (Object.keys(updateData).length === 0) {
    throw new ApiError(400, "At least one rate must be provided");
  }
 if (!currency || currency.trim() === "") {
   throw new ApiError(400, "Currency is not selected");
 }
 updateData.currency=currency;

  const profile = await InspectorProfile.findOneAndUpdate(
    { userId },
    updateData,
    { new: true }
  ).populate("userId", "name email avatar isVerified");

  if (!profile) {
    throw new ApiError(404, "Inspector profile not found");
  }

  res
    .status(200)
    .json(new ApiResponse(200, profile, "Rates updated successfully"));
});

// ✅ ADD Certification
const addCertification = AsyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { certificationBody, level, expiryDate } = req.body;
  const certificateImageFile = req.file;

  if (!certificationBody || !level) {
    throw new ApiError(400, "Certification body and level are required");
  }

  let certificateImage = null;
  if (certificateImageFile) {
    const uploadResult = await uploadToCloudinary(certificateImageFile.path);
    if (!uploadResult.url) {
      throw new ApiError(500, "Failed to upload certificate image");
    }
    certificateImage = uploadResult.url;
    deleteLocalFile(certificateImageFile.path);
  }

  const certification = {
    certificationBody,
    level,
    ...(expiryDate && { expiryDate: new Date(expiryDate) }),
    ...(certificateImage && { certificateImage }),
  };

  const profile = await InspectorProfile.findOneAndUpdate(
    { userId },
    { $push: { certifications: certification } },
    { new: true }
  ).populate("userId", "name email avatar isVerified");

  if (!profile) {
    throw new ApiError(404, "Inspector profile not found");
  }

  res
    .status(200)
    .json(new ApiResponse(200, profile, "Certification added successfully"));
});

// ✅ UPDATE Certification
const updateCertification = AsyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { certificationId } = req.params;
  const { certificationBody, level, expiryDate } = req.body;
  const certificateImageFile = req.file;

  if (!certificationBody || !level) {
    throw new ApiError(400, "Certification body and level are required");
  }

  let updateData = {
    "certifications.$.certificationBody": certificationBody,
    "certifications.$.level": level,
    ...(expiryDate && { "certifications.$.expiryDate": new Date(expiryDate) }),
  };

  if (certificateImageFile) {
    const uploadResult = await uploadToCloudinary(certificateImageFile.path);
    if (!uploadResult.url) {
      throw new ApiError(500, "Failed to upload certificate image");
    }
    updateData["certifications.$.certificateImage"] = uploadResult.url;
    deleteLocalFile(certificateImageFile.path);
  }

  const profile = await InspectorProfile.findOneAndUpdate(
    { userId, "certifications._id": certificationId },
    { $set: updateData },
    { new: true }
  ).populate("userId", "name email avatar isVerified");

  if (!profile) {
    throw new ApiError(404, "Inspector profile or certification not found");
  }

  res
    .status(200)
    .json(new ApiResponse(200, profile, "Certification updated successfully"));
});

// ✅ REMOVE Certification
const removeCertification = AsyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { certificationId } = req.params;

  // Optionally: Remove certificate image from cloud storage if needed
  const profileBefore = await InspectorProfile.findOne({ userId });
  const certToRemove = profileBefore?.certifications?.find(
    (c) => c._id.toString() === certificationId
  );
  if (certToRemove?.certificateImage) {
    await destroyImage(certToRemove.certificateImage);
  }

  const profile = await InspectorProfile.findOneAndUpdate(
    { userId },
    { $pull: { certifications: { _id: certificationId } } },
    { new: true }
  ).populate("userId", "name email avatar isVerified");

  if (!profile) {
    throw new ApiError(404, "Inspector profile not found");
  }

  res
    .status(200)
    .json(new ApiResponse(200, profile, "Certification removed successfully"));
});

// ✅ ADD Job History Entry
const addJobHistory = AsyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { jobId, clientId, date, status, rating, feedback } = req.body;

  if (!jobId || !clientId || !status) {
    throw new ApiError(400, "Job ID, client ID, and status are required");
  }

  const jobHistoryEntry = {
    jobId,
    clientId,
    date: date ? new Date(date) : new Date(),
    status,
    ...(rating && { rating: Number(rating) }),
    ...(feedback && { feedback }),
  };

  const profile = await InspectorProfile.findOne({ userId });
  if (!profile) {
    throw new ApiError(404, "Inspector profile not found");
  }

  profile.jobHistory.push(jobHistoryEntry);

  // Update overall rating if new rating is provided and job is completed
  if (rating && status === "Completed") {
    const completedJobs = profile.jobHistory.filter(
      (job) => job.status === "Completed" && job.rating
    );
    const totalRating = completedJobs.reduce((sum, job) => sum + job.rating, 0);
    profile.rating = totalRating / completedJobs.length;
  }

  // Update total earnings if job is completed (this would typically come from job payment)
  // This is a placeholder - actual earnings should be calculated from payment records
  if (status === "Completed") {
    // profile.totalEarnings += jobPaymentAmount; // Add this when you have payment integration
  }

  await profile.save();
  await profile.populate("userId", "name email avatar isVerified");
  await profile.populate("jobHistory.jobId");
  await profile.populate("jobHistory.clientId", "name email avatar");

  res
    .status(200)
    .json(new ApiResponse(200, profile, "Job history added successfully"));
});

// ✅ UPDATE Resume
const updateResume = AsyncHandler(async (req, res) => {
  const userId = req.user._id;
  const resumeFile = req.file;

  if (!resumeFile) {
    throw new ApiError(400, "Resume file is required");
  }

  // Get current profile to delete old resume
  const currentProfile = await InspectorProfile.findOne({ userId });

  // Upload new resume
  const resumeResult = await uploadToCloudinary(resumeFile.path);
 
  if (!resumeResult.url) {
    throw new ApiError(500, "Failed to upload resume");
  }

  // Delete old resume from cloudinary if exists
  if (currentProfile?.resume?.url) {
    await destroyImage(currentProfile.resume.url);
  }

  const resumeData = {
    url: resumeResult.url,
    uploadedAt: new Date(),
  };

  const profile = await InspectorProfile.findOneAndUpdate(
    { userId },
    { resume: resumeData },
    { new: true }
  ).populate("userId", "name email avatar isVerified");

  deleteLocalFile(resumeFile.path);

  res
    .status(200)
    .json(new ApiResponse(200, profile, "Resume updated successfully"));
});

// ✅ UPDATE Notification Preferences
const updateNotificationPreferences = AsyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { certificateExpiryAlerts, matchingJobEmailAlerts } = req.body;

  const updateData = {};
  if (certificateExpiryAlerts !== undefined) {
    updateData.certificateExpiryAlerts = Boolean(certificateExpiryAlerts);
  }
  if (matchingJobEmailAlerts !== undefined) {
    updateData.matchingJobEmailAlerts = Boolean(matchingJobEmailAlerts);
  }

  if (Object.keys(updateData).length === 0) {
    throw new ApiError(400, "At least one preference must be provided");
  }

  const profile = await InspectorProfile.findOneAndUpdate(
    { userId },
    updateData,
    { new: true }
  ).populate("userId", "name email avatar isVerified");

  if (!profile) {
    throw new ApiError(404, "Inspector profile not found");
  }

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        profile,
        "Notification preferences updated successfully"
      )
    );
});

// ✅ ADD Payout Request
const addPayoutRequest = AsyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { amount } = req.body;

  if (!amount || amount <= 0) {
    throw new ApiError(400, "Valid amount is required");
  }

  const profile = await InspectorProfile.findOne({ userId });
  if (!profile) {
    throw new ApiError(404, "Inspector profile not found");
  }

  // Check if user has sufficient earnings
  if (profile.totalEarnings < amount) {
    throw new ApiError(400, "Insufficient earnings for payout request");
  }

  const payoutRequest = {
    amount: Number(amount),
    status: "Pending",
    requestedAt: new Date(),
  };

  profile.payouts.push(payoutRequest);
  await profile.save();

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        profile.payouts,
        "Payout request created successfully"
      )
    );
});

// ✅ GET My Payout History
const getMyPayouts = AsyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { status, page = 1, limit = 10 } = req.query;

  const profile = await InspectorProfile.findOne({ userId });
  if (!profile) {
    throw new ApiError(404, "Inspector profile not found");
  }

  let payouts = profile.payouts;

  // Filter by status if provided
  if (status) {
    payouts = payouts.filter((payout) => payout.status === status);
  }

  // Pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const paginatedPayouts = payouts
    .sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt))
    .slice(skip, skip + parseInt(limit));

  const pagination = {
    currentPage: parseInt(page),
    totalPages: Math.ceil(payouts.length / parseInt(limit)),
    totalRecords: payouts.length,
    hasNext: parseInt(page) < Math.ceil(payouts.length / parseInt(limit)),
    hasPrev: parseInt(page) > 1,
  };

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {
          payouts: paginatedPayouts,
          pagination,
          totalEarnings: profile.totalEarnings,
        },
        "Payout history fetched successfully"
      )
    );
});

// ✅ GET Inspectors with Expiring Certificates (Admin only)
const getInspectorsWithExpiringCertificates = AsyncHandler(async (req, res) => {
  const { days = 30 } = req.query;
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + parseInt(days));

  const inspectors = await InspectorProfile.find({
    "certifications.expiryDate": { $lte: expiryDate, $gte: new Date() },
    certificateExpiryAlerts: true,
  })
    .populate("userId", "name email")
    .select("fullName certifications userId");

  // Format the response to show which certificates are expiring
  const expiringCertificates = [];
  inspectors.forEach((inspector) => {
    inspector.certifications.forEach((cert) => {
      if (
        cert.expiryDate &&
        cert.expiryDate <= expiryDate &&
        cert.expiryDate >= new Date()
      ) {
        expiringCertificates.push({
          inspectorId: inspector._id,
          inspectorName: inspector.fullName,
          userId: inspector.userId,
          certification: cert,
          daysToExpiry: Math.ceil(
            (cert.expiryDate - new Date()) / (1000 * 60 * 60 * 24)
          ),
        });
      }
    });
  });

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        expiringCertificates,
        `Found ${expiringCertificates.length} certificates expiring in ${days} days`
      )
    );
});

// ✅ VERIFY Inspector (Admin only)
const verifyInspector = AsyncHandler(async (req, res) => {
  const { inspectorId } = req.params;
  const { verified } = req.body;

  if (typeof verified !== "boolean") {
    throw new ApiError(400, "Verified status must be a boolean value");
  }

  const profile = await InspectorProfile.findByIdAndUpdate(
    inspectorId,
    { verified: Boolean(verified) },
    { new: true }
  ).populate("userId", "name email avatar isVerified");

  if (!profile) {
    throw new ApiError(404, "Inspector profile not found");
  }

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        profile,
        `Inspector ${verified ? "verified" : "unverified"} successfully`
      )
    );
});

// ✅ UPDATE Payout Status (Admin only)
const updatePayoutStatus = AsyncHandler(async (req, res) => {
  const { inspectorId, payoutId } = req.params;
  const { status, stripePayoutId } = req.body;

  if (!["Pending", "Approved", "Declined"].includes(status)) {
    throw new ApiError(400, "Invalid payout status");
  }

  const profile = await InspectorProfile.findById(inspectorId);
  if (!profile) {
    throw new ApiError(404, "Inspector profile not found");
  }

  const payout = profile.payouts.id(payoutId);
  if (!payout) {
    throw new ApiError(404, "Payout request not found");
  }

  payout.status = status;
  if (stripePayoutId) {
    payout.stripePayoutId = stripePayoutId;
  }

  // If approved, deduct from total earnings
  if (status === "Approved" && payout.status !== "Approved") {
    profile.totalEarnings -= payout.amount;
  }

  await profile.save();

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        payout,
        `Payout status updated to ${status} successfully`
      )
    );
});

// ✅ UPDATE Subscription Plan
const updateSubscriptionPlan = AsyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { subscriptionPlan } = req.body;

  if (!["Free", "Pro"].includes(subscriptionPlan)) {
    throw new ApiError(400, "Invalid subscription plan");
  }

  const profile = await InspectorProfile.findOneAndUpdate(
    { userId },
    { subscriptionPlan },
    { new: true }
  ).populate("userId", "name email avatar isVerified");

  if (!profile) {
    throw new ApiError(404, "Inspector profile not found");
  }

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        profile,
        `Subscription plan updated to ${subscriptionPlan} successfully`
      )
    );
});

// ✅ DELETE Inspector Profile
const deleteInspectorProfile = AsyncHandler(async (req, res) => {
  const userId = req.user._id;

  const profile = await InspectorProfile.findOneAndDelete({ userId });

  if (!profile) {
    throw new ApiError(404, "Inspector profile not found");
  }

  // Delete resume from cloudinary if exists
  if (profile.resume?.url) {
    await destroyImage(profile.resume.url);
  }

  res
    .status(200)
    .json(new ApiResponse(200, null, "Inspector profile deleted successfully"));
});

// ✅ GET Dashboard Stats (Inspector)
const getDashboardStats = AsyncHandler(async (req, res) => {
  const userId = req.user._id;

  const profile = await InspectorProfile.findOne({ userId });
  if (!profile) {
    throw new ApiError(404, "Inspector profile not found");
  }

  const stats = {
    totalJobs: profile.jobHistory.length,
    completedJobs: profile.jobHistory.filter(
      (job) => job.status === "Completed"
    ).length,
    ongoingJobs: profile.jobHistory.filter((job) => job.status === "Ongoing")
      .length,
    cancelledJobs: profile.jobHistory.filter(
      (job) => job.status === "Cancelled"
    ).length,
    totalEarnings: profile.totalEarnings,
    rating: profile.rating,
    totalCertifications: profile.certifications.length,
    expiringCertificatesCount: profile.certifications.filter((cert) => {
      if (!cert.expiryDate) return false;
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      return (
        cert.expiryDate <= thirtyDaysFromNow && cert.expiryDate >= new Date()
      );
    }).length,
    pendingPayouts: profile.payouts.filter(
      (payout) => payout.status === "Pending"
    ).length,
    isVerified: profile.verified,
    subscriptionPlan: profile.subscriptionPlan,
  };

  res
    .status(200)
    .json(new ApiResponse(200, stats, "Dashboard stats fetched successfully"));
});

export {
  upsertInspectorProfile,
  getInspectorProfile,
  getInspectorById,
  getAllInspectors,
  updateInspectorLocation,
  updateAvailability,
  updateRates,
  addCertification,
  updateCertification,
  removeCertification,
  addJobHistory,
  updateResume,
  updateNotificationPreferences,
  addPayoutRequest,
  getMyPayouts,
  getInspectorsWithExpiringCertificates,
  verifyInspector,
  updatePayoutStatus,
  updateSubscriptionPlan,
  deleteInspectorProfile,
  getDashboardStats,
  sendInspectorOTP,
  verifyInspectorOTP,
};
