import { User } from "../models/User.model.js";
import { AsyncHandler } from "../utils/AsyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadToCloudinary, destroyImage } from "../utils/Cloudinary.js";
import { sendEmail } from "../utils/SendMail.js";
import jwt from "jsonwebtoken";
import fs from "fs";

// Utility: Delete temp file
const deleteLocalFile = (filePath) => {
  if (fs.existsSync(filePath)) {
    fs.unlink(filePath, (err) => {
      if (err) console.error("❌ Error deleting file:", err);
    });
  }
};

// ✅ Register User & Send Verification Email
const registerUser = AsyncHandler(async (req, res) => {
  const { name, email, password, role, acceptedTerms,location,currency } = req.body;
  const avatarPath =  req.file?.path;

  if (!name || !email || !password || !role || !avatarPath || !acceptedTerms||!location||!currency) {
    throw new ApiError(400, "All fields and avatar are required");
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) throw new ApiError(409, "Email already exists");

  const avatar = await uploadToCloudinary(avatarPath);
  if (!avatar?.url) throw new ApiError(500, "Failed to upload avatar");

  const user = await User.create({
    name,
    email,
    password,
    role,
    avatar: avatar.url,
    location,
    currency,
    acceptedTerms
  });

  // Send verification email
  const emailToken = jwt.sign(
    { id: user._id },
    process.env.EMAIL_VERIFICATION_SECRET,
    { expiresIn: "1d" }
  );
  const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${emailToken}`;

  await sendEmail({
    to: email,
    subject: "Verify your email",
    html: `<h2>Welcome, ${name}!</h2>
      <p>Click below to verify your email:</p>
      <a href="${verifyUrl}">Verify Email</a>`,
  });

  deleteLocalFile(avatarPath);

  res
    .status(201)
    .json(
      new ApiResponse(
        201,
        { email },
        "User registered. Please verify your email before logging in."
      )
    );
});

// ✅ Email Verification Handler
const verifyEmail = AsyncHandler(async (req, res) => {
  const { token } = req.query;
  if (!token) throw new ApiError(400, "Token missing");

  const decoded = jwt.verify(token, process.env.EMAIL_VERIFICATION_SECRET);
  const user = await User.findById(decoded.id);
  if (!user) throw new ApiError(404, "User not found");

  if (user.isVerified) {
    throw new ApiError(400, "Email is already verified");
  }

  user.isVerified = true;
  await user.save({ validateBeforeSave: false });

  res.status(200).json(new ApiResponse(200, {}, "Email verified successfully"));
});

// ✅ Generate Tokens
const generateAccessAndRefreshToken = async (userId) => {
  const user = await User.findById(userId);
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });
  return { accessToken, refreshToken };
};

// ✅ Login
const loginUser = AsyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new ApiError(400, "Email and Password are required");
  }

  const user = await User.findOne({ email });
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, "Invalid credentials");
  }

  if (!user.isVerified) {
    throw new ApiError(403, "Please verify your email to log in");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  const safeUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  res
    .cookie("accessToken", accessToken, { httpOnly: true, secure: true })
    .cookie("refreshToken", refreshToken, { httpOnly: true, secure: true })
    .status(200)
    .json(
      new ApiResponse(200, { user: safeUser, accessToken }, "Login successful")
    );
});

// ✅ Refresh Access Token
const refreshAccessToken = AsyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) throw new ApiError(401, "Refresh token missing");

  const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
  const user = await User.findById(decoded.id);

  if (!user || user.refreshToken !== token) {
    throw new ApiError(401, "Invalid refresh token");
  }

  const newAccessToken = user.generateAccessToken();
  const newRefreshToken = user.generateRefreshToken();
  user.refreshToken = newRefreshToken;
  await user.save({ validateBeforeSave: false });

  res
    .cookie("accessToken", newAccessToken, { httpOnly: true, secure: true })
    .cookie("refreshToken", newRefreshToken, { httpOnly: true, secure: true })
    .status(200)
    .json(new ApiResponse(200, { accessToken: newAccessToken }));
});

// ✅ Logout
const logoutUser = AsyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, {
    $unset: { refreshToken: 1 },
  });

  res
    .clearCookie("accessToken", { httpOnly: true, secure: true })
    .clearCookie("refreshToken", { httpOnly: true, secure: true })
    .status(200)
    .json(new ApiResponse(200, {}, "Logged out successfully"));
});

// ✅ Change Password
const changeCurrentUserPassword = AsyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id);

  if (!(await user.comparePassword(currentPassword))) {
    throw new ApiError(401, "Invalid current password");
  }

  if (currentPassword === newPassword) {
    throw new ApiError(400, "New password must be different");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  res.status(200).json(new ApiResponse(200, {}, "Password updated"));
});

// ✅ Get Current User
const getCurrentUser = AsyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select(
    "-password -refreshToken"
  );
  res.status(200).json(new ApiResponse(200, user));
});

// ✅ Update Avatar
const updateAvatarImage = AsyncHandler(async (req, res) => {
  const filePath = req.file?.path;
  if (!filePath) throw new ApiError(400, "Avatar image required");

  const avatar = await uploadToCloudinary(filePath);
  await destroyImage(req.user.avatar);

  const updated = await User.findByIdAndUpdate(
    req.user._id,
    { avatar: avatar.url },
    { new: true }
  ).select("-password -refreshToken");

  deleteLocalFile(filePath);
  res.status(200).json(new ApiResponse(200, updated, "Avatar updated"));
});

// ✅ Admin: Get All Users
const getAllUsers = AsyncHandler(async (req, res) => {
  const { page = 1, limit = 10, role, search, sortBy = 'createdAt', order = 'desc' } = req.query;
  
  const filter = {};
  
  // Role filter
  if (role && role !== 'all') {
    filter.role = role;
  }
  
  // Search filter
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }
  
  const sortOrder = order === 'desc' ? -1 : 1;
  const sortOptions = { [sortBy]: sortOrder };
  
  const users = await User.find(filter)
    .select('-password -refreshToken')
    .sort(sortOptions)
    .limit(limit * 1)
    .skip((page - 1) * limit);
    
  const total = await User.countDocuments(filter);
  
  return res.status(200).json(
    new ApiResponse(200, {
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
      total,
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1
    }, "Users fetched successfully")
  );
});

// ✅ Admin: Update User Role or Status
const updateUserByAdmin = AsyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { role, isVerified, isPremium } = req.body;
  
  if (!userId) {
    throw new ApiError(400, "User ID is required");
  }
  
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  
  const updateData = {};
  if (role !== undefined) updateData.role = role;
  if (isVerified !== undefined) updateData.isVerified = isVerified;
  if (isPremium !== undefined) updateData.isPremium = isPremium;
  
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    updateData,
    { new: true }
  ).select('-password -refreshToken');
  
  return res.status(200).json(
    new ApiResponse(200, updatedUser, "User updated successfully")
  );
});

// ✅ Admin: Delete User
const deleteUserByAdmin = AsyncHandler(async (req, res) => {
  const { userId } = req.params;
  
  if (!userId) {
    throw new ApiError(400, "User ID is required");
  }
  
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  
  // Don't allow deleting admin users
  if (user.role === 'admin') {
    throw new ApiError(403, "Cannot delete admin users");
  }
  
  await User.findByIdAndDelete(userId);
  
  return res.status(200).json(
    new ApiResponse(200, {}, "User deleted successfully")
  );
});

// ✅ Admin: Get User Statistics
const getUserStats = AsyncHandler(async (req, res) => {
  const stats = await User.aggregate([
    {
      $group: {
        _id: "$role",
        count: { $sum: 1 }
      }
    }
  ]);
  
  const verifiedCount = await User.countDocuments({ isVerified: true });
  const premiumCount = await User.countDocuments({ isPremium: true });
  const totalUsers = await User.countDocuments();
  
  const roleStats = {};
  stats.forEach(stat => {
    roleStats[stat._id] = stat.count;
  });
  
  return res.status(200).json(
    new ApiResponse(200, {
      roleStats,
      verifiedCount,
      premiumCount,
      totalUsers,
      unverifiedCount: totalUsers - verifiedCount
    }, "User statistics fetched successfully")
  );
});

export {
  registerUser,
  verifyEmail,
  loginUser,
  refreshAccessToken,
  logoutUser,
  changeCurrentUserPassword,
  getCurrentUser,
  updateAvatarImage,
  getAllUsers,
  updateUserByAdmin,
  deleteUserByAdmin,
  getUserStats,
};
