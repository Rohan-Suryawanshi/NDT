import { ServiceProviderProfile } from "../models/ServiceProviderProfile.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { AsyncHandler } from "../utils/AsyncHandler.js";
import { uploadToCloudinary } from "../utils/Cloudinary.js";
import mongoose from "mongoose";
import axios from "axios";
import qs from "qs";

export const upsertProfile = AsyncHandler(async (req, res) => {
  const userId = req.user._id;
  const {
    contactNumber,
    companyName,
    companyLocation,
    companyDescription,
    companyLat,
    companyLng,
    companySpecialization,
  } = req.body;
  console.log(req.body);

  if (
    !contactNumber ||
    !companyName ||
    !companyLocation ||
    !companyDescription ||
    !companySpecialization
  ) {
    throw new ApiError(400, "All required fields must be filled");
  }

  // Check if phone number is verified
  const verificationKey = `${userId}-${contactNumber}`;
  const verificationData = verifiedPhones.get(verificationKey);
  
  if (!verificationData || Date.now() > verificationData.expiresAt) {
    verifiedPhones.delete(verificationKey);
    throw new ApiError(400, "Phone number must be verified before saving profile");
  }
  
  const lat = parseFloat(companyLat);
  const lng = parseFloat(companyLng);

  if (isNaN(lat) || isNaN(lng)) {
    throw new ApiError(
      400,
      "Invalid coordinates: Latitude and Longitude must be numbers"
    );
  }

  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    throw new ApiError(
      400,
      "Invalid coordinates: Out of valid geographical range"
    );
  }


  const logoFile = req.files?.companyLogo?.[0];
  const proceduresFile = req.files?.proceduresFile?.[0];

  let companyLogoUrl;
  let proceduresUrl;

  if (logoFile) {
    const logoResult = await uploadToCloudinary(logoFile.path);
    if (!logoResult.url)
      throw new ApiError(500, "Failed to upload company logo");
    companyLogoUrl = logoResult.url;
  }

  if (proceduresFile) {
    const proceduresResult = await uploadToCloudinary(proceduresFile.path);
    if (!proceduresResult.url)
      throw new ApiError(500, "Failed to upload procedures file");
    proceduresUrl = proceduresResult.url;
  }

  const profile = await ServiceProviderProfile.findOneAndUpdate(
    { userId },
    {
      contactNumber,
      companyName,
      companyLocation,
      companyDescription,
      companyLat: lat,
      companyLng: lng,
      companySpecialization: companySpecialization?.split(","),
      ...(companyLogoUrl && { companyLogoUrl }),
      ...(proceduresUrl && { proceduresUrl }),
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  // Clean up verification data after successful profile save
  verifiedPhones.delete(`${userId}-${contactNumber}`);

  res
    .status(200)
    .json(new ApiResponse(200, profile, "Profile saved successfully"));
});

const PHONE_EMAIL_API_KEY = process.env.PHONE_EMAIL_API_KEY;

// Twilio Configuration
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

// Temporary storage for OTPs (in production, use Redis or database with expiry)
const otpStore = new Map();
const verifiedPhones = new Map(); // Store verified phone numbers temporarily

// Generate random 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP via Twilio
export const sendOTP = AsyncHandler(async (req, res) => {
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
  otpStore.set(contactNumber, {
    otp,
    timestamp: Date.now(),
    expiresAt: Date.now() + 5 * 60 * 1000 // 5 minutes
  });

  try {
    const data = qs.stringify({
      'From': TWILIO_PHONE_NUMBER,
      'To': contactNumber,
      'Body': `Your NDT-Connect Verification Code is ${otp}. This code will expire in 5 minutes.`
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

// Verify OTP
export const verifyOTP = AsyncHandler(async (req, res) => {
  const { contactNumber, otp } = req.body;
  
  if (!contactNumber || !otp) {
    throw new ApiError(400, "Contact number and OTP are required");
  }

  const storedOtpData = otpStore.get(contactNumber);
  
  if (!storedOtpData) {
    throw new ApiError(400, "OTP not found or expired");
  }

  if (Date.now() > storedOtpData.expiresAt) {
    otpStore.delete(contactNumber);
    throw new ApiError(400, "OTP has expired");
  }

  if (storedOtpData.otp !== otp) {
    throw new ApiError(400, "Invalid OTP");
  }

  // OTP verified successfully, remove from store
  otpStore.delete(contactNumber);
  
  // Mark phone as verified for the user
  verifiedPhones.set(`${req.user._id}-${contactNumber}`, {
    verified: true,
    timestamp: Date.now(),
    expiresAt: Date.now() + 10 * 60 * 1000 // 10 minutes to complete profile
  });
  
  res.status(200).json(
    new ApiResponse(200, { verified: true }, "OTP verified successfully")
  );
});


export const getMyProfile = AsyncHandler(async (req, res) => {
  const userId = req.user._id;

  const profile = await ServiceProviderProfile.findOne({ userId });

  if (!profile) {
    throw new ApiError(404, "Profile not found");
  }

  res
    .status(200)
    .json(new ApiResponse(200, profile, "Profile fetched successfully"));
});

export const deleteMyProfile = AsyncHandler(async (req, res) => {
  const userId = req.user._id;

  const profile = await ServiceProviderProfile.findOneAndDelete({ userId });

  if (!profile) {
    throw new ApiError(404, "No profile found to delete");
  }

  res
    .status(200)
    .json(new ApiResponse(200, null, "Profile deleted successfully"));
});

export const getAllProfiles = AsyncHandler(async (req, res) => {
  const profiles = await ServiceProviderProfile.aggregate([
    {
      $lookup: {
        from: "users", // collection name in MongoDB (lowercase + plural by default)
        localField: "userId",
        foreignField: "_id",
        as: "user",
      },
    },
    {
      $unwind: "$user",
    },
    {
      $lookup: {
        from: "serviceoffereds", // collection name (note: mongoose pluralizes)
        localField: "userId",
        foreignField: "userId",
        as: "services",
      },
    },
    {
      $lookup: {
        from: "services",
        localField: "services.serviceId",
        foreignField: "_id",
        as: "serviceDetails",
      },
    },
    {
      $lookup: {
        from: "companycertifications", // correct collection name (lowercase + pluralized)
        localField: "userId", // map using userId to userId
        foreignField: "userId",
        as: "certificates",
      },
    },
    {
      $project: {
        _id: 1,
        userId: 1,
        companyName: 1,
        companyDescription: 1,
        contactNumber: 1,
        companySpecialization: 1,
        companyLocation: 1,
        companyLogoUrl: 1,
        companyLat: 1,
        companyLng: 1,
        createdAt: 1,
        updatedAt: 1,
        rating:1,
        user: {
          _id: 1,
          fullName: 1,
          email: 1,
          avatar: 1,
        },
        services: 1,
        serviceDetails: 1,
        certificates: 1,
      },
    },
  ]);


  if (profiles.length > 0) {
    console.log(`First profile certificates:`, profiles[0].certificates?.length || 0);
  }
  
  res
    .status(200)
    .json(
      new ApiResponse(200, profiles, "All service provider profiles fetched")
    );
});

export const getProfileByUserId = AsyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    throw new ApiError(400, "User ID is required");
  }

  const profiles = await ServiceProviderProfile.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "user",
      },
    },
    {
      $unwind: "$user",
    },
    {
      $lookup: {
        from: "serviceoffereds",
        localField: "userId",
        foreignField: "userId",
        as: "services",
      },
    },
    {
      $lookup: {
        from: "services",
        localField: "services.serviceId",
        foreignField: "_id",
        as: "serviceDetails",
      },
    },
    {
      $lookup: {
        from: "companycertifications",
        localField: "userId",
        foreignField: "userId",
        as: "certificates",
      },
    },
    {
      $project: {
        _id: 1,
        userId: 1,
        companyName: 1,
        companyDescription: 1,
        companyAddress: 1,
        companySpecialization: 1,
        companyLocation: 1,
        companyLogoUrl: 1,
        yearsOfExperience: 1,
        rating:1,
        createdAt: 1,
        updatedAt: 1,
        user: {
          _id: 1,
          fullName: 1,
          email: 1,
          avatar: 1,
        },
        services: 1,
        serviceDetails: 1,
        certificates: 1,
      },
    },
  ]);

  if (!profiles || profiles.length === 0) {
    throw new ApiError(404, "Service provider profile not found");
  }

  const profile = profiles[0];
  console.log(
    `Found profile for user ${userId} with ${
      profile.certificates?.length || 0
    } certificates`
  );

  res
    .status(200)
    .json(
      new ApiResponse(200, profile, "Service provider profile fetched successfully")
    );
});

