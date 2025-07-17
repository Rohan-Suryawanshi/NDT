import { ServiceOffered } from "../models/ServiceOffered.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { AsyncHandler } from "../utils/AsyncHandler.js";

// Create or update a service offering
export const addServiceOffered = AsyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { serviceId, charge, unit, currency, tax } = req.body;

  if (!serviceId || !charge || !unit) {
    throw new ApiError(400, "Required fields are missing");
  }

  const existing = await ServiceOffered.findOne({ userId, serviceId });
  if (existing) {
    // update
    existing.charge = charge;
    existing.unit = unit;
    existing.currency = currency;
    existing.tax = tax;
    await existing.save();
    return res
      .status(200)
      .json(new ApiResponse(200, existing, "Service offering updated"));
  }

  const newService = await ServiceOffered.create({
    userId,
    serviceId,
    charge,
    unit,
    currency,
    tax,
  });

  res
    .status(201)
    .json(new ApiResponse(201, newService, "Service offering added"));
});

// Get all services offered by the current provider
export const getMyServices = AsyncHandler(async (req, res) => {
  const userId = req.user._id;

  const services = await ServiceOffered.find({ userId }).populate(
    "serviceId",
    "name"
  );

  res
    .status(200)
    .json(new ApiResponse(200, services, "Your service offerings"));
});

// Delete a service offering
export const deleteServiceOffered = AsyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { id } = req.params;

  const deleted = await ServiceOffered.findOneAndDelete({ _id: id, userId });

  if (!deleted) {
    throw new ApiError(404, "Service offering not found");
  }

  res.status(200).json(new ApiResponse(200, null, "Service offering deleted"));
});
