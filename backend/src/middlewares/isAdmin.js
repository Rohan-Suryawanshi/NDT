// middlewares/isAdmin.js
import { ApiError } from "../utils/ApiError.js";

export const isAdmin = (req, res, next) => {
  if (req.user?.role !== "admin" && req.user?.role !== "finance") {
    throw new ApiError(403, "Only admin and finance can perform this action");
  }
  next();
};
