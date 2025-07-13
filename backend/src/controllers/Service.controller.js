import { Service } from "../models/Service.model.js";
import { AsyncHandler } from "../utils/AsyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// 🔹 Create a new service
const createService = AsyncHandler(async (req, res) => {
  const { name, code, description, isPremium } = req.body;

  if (!name || !code) {
    throw new ApiError(400, "Name and code are required");
  }

  const existing = await Service.findOne({ code });
  if (existing) {
    throw new ApiError(409, "Service with this code already exists");
  }

  const service = await Service.create({
    name,
    code,
    description,
    isPremium,
  });

  res
    .status(201)
    .json(new ApiResponse(201, service, "Service created successfully"));
});

// 🔹 Get all services
const getAllServices = AsyncHandler(async (req, res) => {
  const services = await Service.find();
  res.status(200).json(new ApiResponse(200, services, "All services fetched"));
});

// 🔹 Get service by ID
const getServiceById = AsyncHandler(async (req, res) => {
  const { id } = req.params;

  const service = await Service.findById(id);
  if (!service) {
    throw new ApiError(404, "Service not found");
  }

  res.status(200).json(new ApiResponse(200, service, "Service fetched"));
});

// 🔹 Update service
const updateService = AsyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, code, description, isPremium } = req.body;

  const updated = await Service.findByIdAndUpdate(
    id,
    { name, code, description, isPremium },
    { new: true }
  );

  if (!updated) {
    throw new ApiError(404, "Service not found");
  }

  res
    .status(200)
    .json(new ApiResponse(200, updated, "Service updated successfully"));
});

// 🔹 Delete service
const deleteService = AsyncHandler(async (req, res) => {
  const { id } = req.params;

  const deleted = await Service.findByIdAndDelete(id);
  if (!deleted) {
    throw new ApiError(404, "Service not found");
  }

  res
    .status(200)
    .json(new ApiResponse(200, {}, "Service deleted successfully"));
});

export {
  createService,
  getAllServices,
  getServiceById,
  updateService,
  deleteService,
};
