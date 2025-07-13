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

  // Validate presence of required fields
  if (!fullName || typeof fullName !== "string" || fullName.trim().length === 0)
    throw new ApiError(400, "Full Name is required and must be a string.");

  if (
    !contactNumber ||
    typeof contactNumber !== "string" ||
    contactNumber.length < 10
  )
    throw new ApiError(400, "Valid contact number is required.");

  if (!companyName || typeof companyName !== "string")
    throw new ApiError(400, "Company name is required.");

  if (!businessLocation || typeof businessLocation !== "string")
    throw new ApiError(400, "Business location is required.");

  if (!twicExpiry || isNaN(Date.parse(twicExpiry)))
    throw new ApiError(400, "Valid TWIC expiry date is required.");

  if (!gatePassExpiry || isNaN(Date.parse(gatePassExpiry)))
    throw new ApiError(400, "Valid Gate Pass expiry date is required.");

  if (acceptedTerms !== true && acceptedTerms !== "true")
    throw new ApiError(400, "Terms must be accepted to proceed.");

  // Validate & Parse arrays
  let parsedServices = [];
  let parsedSkills = [];
  let parsedCerts = [];

  try {
    parsedServices = services ? JSON.parse(services) : [];
    if (!Array.isArray(parsedServices)) throw new Error();
  } catch {
    throw new ApiError(400, "Services must be a valid JSON array.");
  }

  try {
    parsedSkills = skillMatrix ? JSON.parse(skillMatrix) : [];
    if (!Array.isArray(parsedSkills)) throw new Error();
  } catch {
    throw new ApiError(400, "Skill Matrix must be a valid JSON array.");
  }

  try {
    parsedCerts = companyCertifications
      ? JSON.parse(companyCertifications)
      : [];
    if (!Array.isArray(parsedCerts)) throw new Error();
  } catch {
    throw new ApiError(
      400,
      "Company certifications must be a valid JSON array."
    );
  }

  // Validate files
  const files = req.files || {};
  const twicCertPath = files?.twicCertificate?.[0]?.path;
  const gatePassCertPath = files?.gatePassCertificate?.[0]?.path;
  const companyLogoPath = files?.companyLogo?.[0]?.path;

  if (!twicCertPath || !gatePassCertPath || !companyLogoPath) {
    throw new ApiError(
      400,
      "TWIC, Gate Pass certificates and Company Logo are required."
    );
  }

  // Upload to Cloudinary
  const twicUpload = await uploadToCloudinary(twicCertPath);
  const gatePassUpload = await uploadToCloudinary(gatePassCertPath);
  const logoUpload = await uploadToCloudinary(companyLogoPath);

  deleteLocalFile(twicCertPath);
  deleteLocalFile(gatePassCertPath);
  deleteLocalFile(companyLogoPath);

  // Prepare profile data
  const profileData = {
    userId,
    fullName: fullName.trim(),
    contactNumber,
    companyName: companyName.trim(),
    businessLocation: businessLocation.trim(),
    acceptedTerms: true,
    companyLogoUrl: logoUpload?.url || "",
    certificates: {
      twic: {
        fileUrl: twicUpload?.url || "",
        expiryDate: new Date(twicExpiry),
      },
      gatePass: {
        fileUrl: gatePassUpload?.url || "",
        expiryDate: new Date(gatePassExpiry),
      },
    },
    services: parsedServices,
    skillMatrix: parsedSkills,
    companyCertifications: parsedCerts,
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

// const upsertServiceProvider = AsyncHandler(async (req, res) => {
//   const userId = req.user._id;

//   const {
//     fullName,
//     contactNumber,
//     companyName,
//     businessLocation,
//     twicExpiry,
//     gatePassExpiry,
//     acceptedTerms,
//     services,
//     skillMatrix,
//     companyCertifications,
//   } = req.body;

//   // Validate required fields
//   if (
//     !fullName ||
//     !contactNumber ||
//     !companyName ||
//     !businessLocation ||
//     !twicExpiry ||
//     !gatePassExpiry ||
//     !acceptedTerms
//   ) {
//     throw new ApiError(
//       400,
//       "All fields and certificate expiries are required."
//     );
//   }

//   // File uploads
//   const files = req.files || {};
//   const twicCertPath = files?.twicCertificate?.[0]?.path;
//   const gatePassCertPath = files?.gatePassCertificate?.[0]?.path;
//   const companyLogoPath = files?.companyLogo?.[0]?.path;

//   if (
//     !twicCertPath ||
//     !gatePassCertPath ||
//     !companyLogoPath
//   ) {
//     throw new ApiError(
//       400,
//       "All certificate files and company logo are required."
//     );
//   }

//   // Upload to Cloudinary
//   const twicUpload = await uploadToCloudinary(twicCertPath);
//   const gatePassUpload = await uploadToCloudinary(gatePassCertPath);
//   const logoUpload = await uploadToCloudinary(companyLogoPath);

//   deleteLocalFile(twicCertPath);
//   deleteLocalFile(gatePassCertPath);
//   deleteLocalFile(companyLogoPath);

//   // Prepare data
//   const profileData = {
//     userId,
//     fullName,
//     contactNumber,
//     companyName,
//     businessLocation,
//     acceptedTerms: acceptedTerms === "true" || acceptedTerms === true,
//     companyLogoUrl: logoUpload?.url || "",
//     certificates: {
//       twic: {
//         fileUrl: twicUpload?.url || "",
//         expiryDate: new Date(twicExpiry),
//       },
//       gatePass: {
//         fileUrl: gatePassUpload?.url || "",
//         expiryDate: new Date(gatePassExpiry),
//       }
//     },
//     services: services ? JSON.parse(services) : [],
//     skillMatrix: skillMatrix ? JSON.parse(skillMatrix) : [],
//     companyCertifications: companyCertifications
//       ? JSON.parse(companyCertifications)
//       : [],
//   };

//   const profile = await ServiceProviderProfile.findOneAndUpdate(
//     { userId },
//     profileData,
//     { new: true, upsert: true, setDefaultsOnInsert: true }
//   );

//   res
//     .status(200)
//     .json(new ApiResponse(200, profile, "Service provider profile saved"));
// });


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
  const profiles = await ServiceProviderProfile.find()
    .populate("userId", "-password -refreshToken")
    .populate("services.serviceId");
;
  res
    .status(200)
    .json(new ApiResponse(200, profiles, "All provider profiles retrieved"));
});

export {
  upsertServiceProvider,
  getServiceProviderProfile,
  getAllServiceProviders,
};
