import { Equipment } from "../models/Equipment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { AsyncHandler } from "../utils/AsyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";


export const createEquipment = AsyncHandler(async (req, res) => {
  const { method, manufacturer, model, serialNumber, calibrationExpiry } =
    req.body;

  if (!method || !manufacturer || !serialNumber || !calibrationExpiry) {
    throw new ApiError(400, "All required fields must be provided");
  }

  const equipment = await Equipment.create({
    userId: req.user._id,
    method,
    manufacturer,
    model,
    serialNumber,
    calibrationExpiry,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, equipment, "Equipment created successfully"));
});


export const getAllEquipments = AsyncHandler(async (req, res) => {
  const equipments = await Equipment.find({ userId: req.user._id }).sort({
    createdAt: -1,
  });

  return res.status(200).json(new ApiResponse(200, equipments));
});


export const getEquipmentById = AsyncHandler(async (req, res) => {
  const { id } = req.params;

  const equipment = await Equipment.findOne({ _id: id, userId: req.user._id });

  if (!equipment) {
    throw new ApiError(404, "Equipment not found or access denied");
  }

  return res.status(200).json(new ApiResponse(200, equipment));
});


export const updateEquipment = AsyncHandler(async (req, res) => {
  const { id } = req.params;

  const equipment = await Equipment.findOneAndUpdate(
    { _id: id, userId: req.user._id },
    { ...req.body },
    { new: true, runValidators: true }
  );

  if (!equipment) {
    throw new ApiError(404, "Equipment not found or access denied");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, equipment, "Equipment updated successfully"));
});


export const deleteEquipment = AsyncHandler(async (req, res) => {
  const { id } = req.params;

  const equipment = await Equipment.findOneAndDelete({
    _id: id,
    userId: req.user._id,
  });

  if (!equipment) {
    throw new ApiError(404, "Equipment not found or access denied");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Equipment deleted successfully"));
});
