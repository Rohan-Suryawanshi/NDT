import { CompanyCertification } from "../models/CompanyCertification.model.js";
import { AsyncHandler } from "../utils/AsyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadToCloudinary } from "../utils/Cloudinary.js";
import fs from "fs";

// Delete local file after Cloudinary upload
const deleteLocalFile = (filePath) => {
  if (fs.existsSync(filePath)) {
    fs.unlink(filePath, (err) => {
      if (err) console.error("❌ Failed to delete local file:", err);
    });
  }
};

// ✅ Upload a new company certificate
const createCompanyCertificate = AsyncHandler(async (req, res) => {
  const userId = req.user._id;
  const {
    certificateName,
    certificationBody,
    category,
    issuedYear,
    expiryDate,
  } = req.body;

  if (
    !certificateName ||
    !certificationBody ||
    !issuedYear ||
    !expiryDate ||
    !req.file
  ) {
    throw new ApiError(400, "All fields and certificate file are required.");
  }

  const localFilePath = req.file.path;
  const uploadResult = await uploadToCloudinary(localFilePath);
  deleteLocalFile(localFilePath);

  if (!uploadResult?.url) {
    throw new ApiError(500, "Certificate upload failed.");
  }

  const certificate = await CompanyCertification.create({
    userId,
    certificateName,
    certificationBody,
    category,
    issuedYear,
    expiryDate,
    certificateUrl: uploadResult.url,
  });

  res
    .status(201)
    .json(
      new ApiResponse(201, certificate, "Certificate uploaded successfully")
    );
});

// ✅ Get all company certificates for current user
const getMyCompanyCertificates = AsyncHandler(async (req, res) => {
  const userId = req.user._id;

  const certificates = await CompanyCertification.find({ userId });

  res
    .status(200)
    .json(
      new ApiResponse(200, certificates, "Certificates fetched successfully")
    );
});

const editCompanyCertificate = AsyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;
  const {
    certificateName,
    certificationBody,
    category,
    issuedYear,
    expiryDate,
  } = req.body;

  const existingCert = await CompanyCertification.findOne({ _id: id, userId });
  if (!existingCert) {
    throw new ApiError(404, "Certificate not found");
  }

  let certificateUrl = existingCert.certificateUrl;

  // If a new file is uploaded
  if (req.file) {
    const localFilePath = req.file.path;

    const uploadResult = await uploadToCloudinary(localFilePath);
    deleteLocalFile(localFilePath);

    if (!uploadResult?.url) {
      throw new ApiError(500, "New certificate upload failed");
    }

    certificateUrl = uploadResult.url;
  }

  // Update certificate fields
  existingCert.certificateName =
    certificateName || existingCert.certificateName;
  existingCert.certificationBody =
    certificationBody || existingCert.certificationBody;
  existingCert.category = category || existingCert.category;
  existingCert.issuedYear = issuedYear || existingCert.issuedYear;
  existingCert.expiryDate = expiryDate || existingCert.expiryDate;
  existingCert.certificateUrl = certificateUrl;

  await existingCert.save();

  res
    .status(200)
    .json(
      new ApiResponse(200, existingCert, "Certificate updated successfully")
    );
});


// ✅ Delete certificate by ID
const deleteCompanyCertificate = AsyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  const certificate = await CompanyCertification.findOneAndDelete({
    _id: id,
    userId,
  });

  if (!certificate) {
    throw new ApiError(404, "Certificate not found or already deleted");
  }

  res
    .status(200)
    .json(new ApiResponse(200, null, "Certificate deleted successfully"));
});

export {
  createCompanyCertificate,
  getMyCompanyCertificates,
  deleteCompanyCertificate,
  editCompanyCertificate, 
};
