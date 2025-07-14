import { SkillMatrix } from "../models/SkillMatrix.model.js";
import { AsyncHandler } from "../utils/AsyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadToCloudinary } from "../utils/Cloudinary.js";
import fs from "fs";

// Delete file after upload
const deleteLocalFile = (filePath) => {
  if (fs.existsSync(filePath)) {
    fs.unlink(filePath, (err) => {
      if (err) console.error("❌ Failed to delete file:", err);
    });
  }
};

// ✅ Create Skill Matrix
export const createSkillMatrix = AsyncHandler(async (req, res) => {
  const userId = req.user._id;

  const { technician, certificates } = JSON.parse(req.body.data);

  if (
    !technician?.name ||
    !Array.isArray(certificates) ||
    certificates.length === 0
  ) {
    throw new ApiError(
      400,
      "Technician name and certificate details are required."
    );
  }

  const files = req.files?.certificateFiles || [];

  if (files.length !== certificates.length) {
    throw new ApiError(
      400,
      "Number of certificate files and data entries must match."
    );
  }

  const uploadedCertificates = await Promise.all(
    files.map(async (file, index) => {
      const filePath = file.path;
      const result = await uploadToCloudinary(filePath);
      deleteLocalFile(filePath);

      if (!result?.url) throw new ApiError(500, "Upload failed");

      const cert = certificates[index];
      return {
        method: cert.method,
        level: cert.level,
        certificationExpiryDate: cert.certificationExpiryDate,
        certificationUrl: result.url,
      };
    })
  );

  const newMatrix = await SkillMatrix.create({
    userId,
    technician,
    certificates: uploadedCertificates,
  });

  res.status(201).json(new ApiResponse(201, newMatrix, "Created Skill Matrix"));
});

// ✅ Get Skill Matrices for current user
export const getMySkillMatrices = AsyncHandler(async (req, res) => {
  const userId = req.user._id;
  const list = await SkillMatrix.find({ userId });
  res.status(200).json(new ApiResponse(200, list));
});

// ✅ Get by ID
export const getSkillMatrixById = AsyncHandler(async (req, res) => {
  const matrix = await SkillMatrix.findOne({
    _id: req.params.id,
    userId: req.user._id,
  });

  if (!matrix) throw new ApiError(404, "Skill matrix not found");
  res.status(200).json(new ApiResponse(200, matrix));
});

// ✅ Update
export const updateSkillMatrix = AsyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { id } = req.params;
  const { technician, certificates } = JSON.parse(req.body.data);

  const existing = await SkillMatrix.findOne({ _id: id, userId });
  if (!existing) throw new ApiError(404, "Skill matrix not found");

  const files = req.files?.certificateFiles || [];

  const updatedCertificates = await Promise.all(
    certificates.map(async (cert, index) => {
      if (files[index]) {
        const localPath = files[index].path;
        const result = await uploadToCloudinary(localPath);
        deleteLocalFile(localPath);
        if (!result?.url) throw new ApiError(500, "Upload failed");
        return {
          ...cert,
          certificationUrl: result.url,
        };
      }
      return cert; // retain URL if no file is uploaded for this cert
    })
  );

  existing.technician = technician;
  existing.certificates = updatedCertificates;
  await existing.save();

  res.status(200).json(new ApiResponse(200, existing, "Updated successfully"));
});

// ✅ Delete
export const deleteSkillMatrix = AsyncHandler(async (req, res) => {
  const deleted = await SkillMatrix.findOneAndDelete({
    _id: req.params.id,
    userId: req.user._id,
  });

  if (!deleted) throw new ApiError(404, "Skill matrix not found");

  res.status(200).json(new ApiResponse(200, null, "Deleted successfully"));
});
