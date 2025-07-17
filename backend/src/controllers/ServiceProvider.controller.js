import { ServiceProviderProfile } from "../models/ServiceProviderProfile.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { AsyncHandler } from "../utils/AsyncHandler.js";
import { uploadToCloudinary } from "../utils/Cloudinary.js";

export const upsertProfile = AsyncHandler(async (req, res) => {
  const userId = req.user._id;
  const {
    contactNumber,
    companyName,
    companyLocation,
    companyDescription,
    companySpecialization,
  } = req.body;

  if (
    !contactNumber ||
    !companyName ||
    !companyLocation ||
    !companyDescription ||
    !companySpecialization
  ) {
    throw new ApiError(400, "All required fields must be filled");
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
      companySpecialization,
      ...(companyLogoUrl && { companyLogoUrl }),
      ...(proceduresUrl && { proceduresUrl }),
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  res
    .status(200)
    .json(new ApiResponse(200, profile, "Profile saved successfully"));
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
  const profiles = await ServiceProviderProfile.find().populate(
    "userId",
    "name email"
  );

  res
    .status(200)
    .json(
      new ApiResponse(200, profiles, "All service provider profiles fetched")
    );
});
