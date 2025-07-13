import mongoose from "mongoose";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    avatar: {
      type: String, // Cloudinary URL
      required: true,
    },
    role: {
      type: String,
      enum: ["client", "provider", "inspector", "admin"],
      required: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isPremium: {
      type: Boolean,
      default: false,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    refreshToken: {
      type: String,
      default: "",
    },
    acceptedTerms: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// ✅ Hash password before saving
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcryptjs.genSalt(10);
  this.password = await bcryptjs.hash(this.password, salt);
  next();
});

// ✅ Compare password method
UserSchema.methods.comparePassword = async function (password) {
  return await bcryptjs.compare(password, this.password);
};

// ✅ Access Token
UserSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      id: this._id,
      role: this.role,
      email: this.email,
      name: this.name,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY, // e.g., "15m"
    }
  );
};

// ✅ Refresh Token
UserSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY, // e.g., "7d"
    }
  );
};

export const User = mongoose.model("User", UserSchema);
