import { ServiceProviderProfile } from "../models/ServiceProviderProfile.model.js";
import { AsyncHandler } from "../utils/AsyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadToCloudinary, destroyImage } from "../utils/Cloudinary.js";
import fs from "fs";

// Delete local file after upload
const deleteLocalFile = (filePath) => {
  console.log(filePath)
  if (fs.existsSync(filePath)) {
    fs.unlink(filePath, (err) => {
      if (err) console.error("❌ Error deleting file:", err);
    });
  }
};
const upsertServiceProvider = AsyncHandler(async (req, res) => {
  const userId = req.user._id;

  const {
    fullName,
    contactNumber,
    companyName,
    businessLocation,
    twicExpiry,
    gatePassExpiry,
    acceptedTerms,
    services,
    skillMatrix,
    companyCertifications,
  } = req.body;

  // Validate required fields
  if (
    !fullName ||
    !contactNumber ||
    !companyName ||
    !businessLocation ||
    !twicExpiry ||
    !gatePassExpiry ||
    !acceptedTerms
  ) {
    throw new ApiError(
      400,
      "All fields and certificate expiries are required."
    );
  }

  // File uploads
  const files = req.files || {};
  const twicCertPath = files?.twicCertificate?.[0]?.path;
  const gatePassCertPath = files?.gatePassCertificate?.[0]?.path;
  const companyLogoPath = files?.companyLogo?.[0]?.path;

  if (
    !twicCertPath ||
    !gatePassCertPath ||
    !companyLogoPath
  ) {
    throw new ApiError(
      400,
      "All certificate files and company logo are required."
    );
  }

  // Upload to Cloudinary
  const twicUpload = await uploadToCloudinary(twicCertPath);
  const gatePassUpload = await uploadToCloudinary(gatePassCertPath);
  const logoUpload = await uploadToCloudinary(companyLogoPath);

  deleteLocalFile(twicCertPath);
  deleteLocalFile(gatePassCertPath);
  deleteLocalFile(companyLogoPath);

  // Prepare data
  const profileData = {
    userId,
    fullName,
    contactNumber,
    companyName,
    businessLocation,
    acceptedTerms: acceptedTerms === "true" || acceptedTerms === true,
    companyLogoUrl: logoUpload?.url || "",
    certificates: {
      twic: {
        fileUrl: twicUpload?.url || "",
        expiryDate: new Date(twicExpiry),
      },
      gatePass: {
        fileUrl: gatePassUpload?.url || "",
        expiryDate: new Date(gatePassExpiry),
      }
    },
    services: services ? JSON.parse(services) : [],
    skillMatrix: skillMatrix ? JSON.parse(skillMatrix) : [],
    companyCertifications: companyCertifications
      ? JSON.parse(companyCertifications)
      : [],
  };

  const profile = await ServiceProviderProfile.findOneAndUpdate(
    { userId },
    profileData,
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  res
    .status(200)
    .json(new ApiResponse(200, profile, "Service provider profile saved"));
});


// ✅ Get Current User's Provider Profile with populated userId & services
const getServiceProviderProfile = AsyncHandler(async (req, res) => {
  const userId = req.user._id;

  const profile = await ServiceProviderProfile.findOne({ userId })
    .populate("userId", "-password -refreshToken")
    .populate("services.serviceId"); // ✅ Populate each serviceId

  if (!profile) {
    throw new ApiError(404, "Service provider profile not found");
  }

  res.status(200).json(
    new ApiResponse(200, profile, "Provider profile retrieved")
  );
});


// ✅ Admin: Get All Service Providers
const getAllServiceProviders = AsyncHandler(async (req, res) => {
  const profiles = await ServiceProviderProfile.find().populate(
    "userId",
    "-password -refreshToken"
  );
  res
    .status(200)
    .json(new ApiResponse(200, profiles, "All provider profiles retrieved"));
});

export {
  upsertServiceProvider,
  getServiceProviderProfile,
  getAllServiceProviders,
};
