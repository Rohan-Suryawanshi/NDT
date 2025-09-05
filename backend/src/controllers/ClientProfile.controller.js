import { AsyncHandler } from "../utils/AsyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ClientProfile } from "../models/ClientProfile.model.js";
import axios from "axios";
import qs from "qs";

// Twilio Configuration
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

// Temporary storage for OTPs (in production, use Redis or database with expiry)
const clientOtpStore = new Map();
const clientVerifiedPhones = new Map(); // Store verified phone numbers temporarily

// Generate random 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP via Twilio for Client
export const sendClientOTP = AsyncHandler(async (req, res) => {
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
  clientOtpStore.set(contactNumber, {
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

// Verify OTP for Client
export const verifyClientOTP = AsyncHandler(async (req, res) => {
  const { contactNumber, otp } = req.body;
  
  if (!contactNumber || !otp) {
    throw new ApiError(400, "Contact number and OTP are required");
  }

  const storedOtpData = clientOtpStore.get(contactNumber);
  
  if (!storedOtpData) {
    throw new ApiError(400, "OTP not found or expired");
  }

  if (Date.now() > storedOtpData.expiresAt) {
    clientOtpStore.delete(contactNumber);
    throw new ApiError(400, "OTP has expired");
  }

  if (storedOtpData.otp !== otp) {
    throw new ApiError(400, "Invalid OTP");
  }

  // OTP verified successfully, remove from store
  clientOtpStore.delete(contactNumber);
  
  // Mark phone as verified for the user
  clientVerifiedPhones.set(`${req.user._id}-${contactNumber}`, {
    verified: true,
    timestamp: Date.now(),
    expiresAt: Date.now() + 10 * 60 * 1000 // 10 minutes to complete profile
  });
  
  res.status(200).json(
    new ApiResponse(200, { verified: true }, "OTP verified successfully")
  );
});

// ✅ Create or Update Client Profile
const upsertClientProfile = AsyncHandler(async (req, res) => {
  const userId = req.user._id;
  const {
    companyName,
    industry,
    primaryLocation,
    contactNumber,
    acceptedTerms,
  } = req.body;

  if (!companyName || !industry || !primaryLocation || !contactNumber) {
    throw new ApiError(400, "All fields are required");
  }

  // Check if phone number is verified
  const verificationKey = `${userId}-${contactNumber}`;
  const verificationData = clientVerifiedPhones.get(verificationKey);
  
  if (!verificationData || Date.now() > verificationData.expiresAt) {
    clientVerifiedPhones.delete(verificationKey);
    throw new ApiError(400, "Phone number must be verified before saving profile");
  }

  const profileData = {
    userId,
    companyName,
    industry,
    primaryLocation,
    contactNumber,
    acceptedTerms: acceptedTerms || false,
  };

  const profile = await ClientProfile.findOneAndUpdate(
    { userId },
    profileData,
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  // Clean up verification data after successful profile save
  clientVerifiedPhones.delete(`${userId}-${contactNumber}`);

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        profile,
        "Client profile created/updated successfully"
      )
    );
});

// ✅ Get Current Client Profile
const getClientProfile = AsyncHandler(async (req, res) => {
  const userId = req.user._id;

  const profile = await ClientProfile.findOne({ userId }).populate(
    "userId",
    "-password -refreshToken"
  );

  if (!profile) {
    throw new ApiError(404, "Client profile not found");
  }

  res
    .status(200)
    .json(
      new ApiResponse(200, profile, "Client profile retrieved successfully")
    );
});

// ✅ Admin: Get All Client Profiles
const getAllClientProfiles = AsyncHandler(async (req, res) => {
  const profiles = await ClientProfile.find().populate(
    "userId",
    "-password -refreshToken"
  );

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        profiles,
        "All client profiles retrieved successfully"
      )
    );
});

// ✅ Admin: Delete Client Profile
const deleteClientProfile = AsyncHandler(async (req, res) => {
  const { userId } = req.params;

  const profile = await ClientProfile.findOneAndDelete({ userId });

  if (!profile) {
    throw new ApiError(404, "Client profile not found");
  }

  res
    .status(200)
    .json(new ApiResponse(200, {}, "Client profile deleted successfully"));
});

export {
  upsertClientProfile,
  getClientProfile,
  getAllClientProfiles,
  deleteClientProfile,
};
