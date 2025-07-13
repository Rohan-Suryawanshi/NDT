import { AsyncHandler } from "../utils/AsyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ClientProfile } from "../models/clientprofile.model.js";

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
