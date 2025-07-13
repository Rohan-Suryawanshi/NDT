import { InspectorProfile } from "../models/InspectorProfile.model.js";
import { AsyncHandler } from "../utils/AsyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";

// ✅ Create or update Inspector Profile
const upsertInspectorProfile = AsyncHandler(async (req, res) => {
  const userId = req.user._id;
  const {
    fullName,
    contactNumber,
    associationType,
    companyId,
    certifications,
    acceptedTerms,
  } = req.body;

  // Validate required fields
  if (
    !fullName ||
    !contactNumber ||
    !associationType ||
    (acceptedTerms !== "true" && acceptedTerms !== true)
  ) {
    throw new ApiError(
      400,
      "All required fields must be filled and terms must be accepted"
    );
  }

  const profileData = {
    userId,
    fullName,
    contactNumber,
    associationType,
    companyId: companyId || null,
    acceptedTerms: acceptedTerms === "true" || acceptedTerms === true,
    certifications: certifications ? JSON.parse(certifications) : [],
  };

  const profile = await InspectorProfile.findOneAndUpdate(
    { userId },
    profileData,
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  res
    .status(200)
    .json(new ApiResponse(200, profile, "Inspector profile saved"));
});

// ✅ Get current user's Inspector Profile
const getInspectorProfile = AsyncHandler(async (req, res) => {
  const userId = req.user._id;

  const profile = await InspectorProfile.findOne({ userId }).populate(
    "userId",
    "-password -refreshToken"
  );

  if (!profile) throw new ApiError(404, "Inspector profile not found");

  res
    .status(200)
    .json(new ApiResponse(200, profile, "Inspector profile retrieved"));
});

// ✅ Admin: Get all Inspector Profiles
const getAllInspectors = AsyncHandler(async (req, res) => {
  const profiles = await InspectorProfile.find().populate(
    "userId",
    "-password -refreshToken"
  );
  res
    .status(200)
    .json(new ApiResponse(200, profiles, "All inspector profiles retrieved"));
});

export { upsertInspectorProfile, getInspectorProfile, getAllInspectors };
