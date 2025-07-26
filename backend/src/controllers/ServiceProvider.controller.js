import { ServiceProviderProfile } from "../models/ServiceProviderProfile.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { AsyncHandler } from "../utils/AsyncHandler.js";
import { uploadToCloudinary } from "../utils/Cloudinary.js";
import mongoose from "mongoose";

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
      companySpecialization:companySpecialization?.split(','),
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

  console.log(`Found ${profiles.length} service provider profiles`);
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

