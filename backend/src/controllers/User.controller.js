import { User } from "../models/user.model.js";
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
  const { name, email, password, role, acceptedTerms } = req.body;
  const avatarPath =  req.file?.path;

  if (!name || !email || !password || !role || !avatarPath || !acceptedTerms) {
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


export {
  registerUser,
  verifyEmail,
  loginUser,
  refreshAccessToken,
  logoutUser,
  changeCurrentUserPassword,
  getCurrentUser,
  updateAvatarImage,
};
