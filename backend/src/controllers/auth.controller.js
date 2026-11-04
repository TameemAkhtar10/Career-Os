import bcrypt from "bcrypt";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { createAndSendOtp, verifyOtp } from "../services/otp.service.js";
import {
  generateAccessToken,
  generateRefreshToken,
  setAuthCookies,
  clearAuthCookies,
  verifyRefreshToken,
  REFRESH_COOKIE,
} from "../services/token.service.js";
import { delCache } from "../utils/cache.js";

const REFRESH_SALT = 10;
const USER_CACHE_KEY = (id) => `user:${id}`;

// ── Private helpers ───────────────────────────────────────────────────────────

const _safeUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  status: user.status || "active",
  isEmailVerified: user.isEmailVerified,
  createdAt: user.createdAt,
});

/**
 * Issue new access + refresh tokens, rotate the stored hash on the user,
 * and set both as httpOnly cookies. Returns void — tokens only live in cookies.
 */
const _issueAndRotate = async (res, user) => {
  const accessToken = generateAccessToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id);

  // Store bcrypt hash of the new refresh token for reuse detection
  user.refreshTokenHash = await bcrypt.hash(refreshToken, REFRESH_SALT);
  await user.save();

  setAuthCookies(res, accessToken, refreshToken);
};

// ── Controllers ───────────────────────────────────────────────────────────────

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  const existing = await User.findOne({ email });

  if (existing) {
    // If already verified → reject
    if (existing.isEmailVerified) {
      throw new ApiError(409, "An account with this email already exists.");
    }
    // Unverified account: update credentials and resend OTP
    // (respects the 60-second resend cooldown inside createAndSendOtp)
    existing.name = name;
    existing.password = password; // pre-save hook rehashes
    existing.role = role;
    await existing.save();
    await createAndSendOtp(email, "verify_email");

    return res
      .status(201)
      .json(new ApiResponse(201, null, "Account created. Check your email for the OTP."));
  }

  await User.create({ name, email, password, role });
  await createAndSendOtp(email, "verify_email");

  res
    .status(201)
    .json(new ApiResponse(201, null, "Account created. Check your email for the OTP."));
});

export const verifyEmail = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  // Anti-enumeration: same error for wrong user OR wrong OTP
  const user = await User.findOne({ email }).select("+refreshTokenHash");

  if (!user || user.isEmailVerified) {
    // Still attempt OTP verification to consume/count the attempt
    // then return a generic error regardless of the actual failure
    try { await verifyOtp(email, otp, "verify_email"); } catch { /* ignored */ }
    throw new ApiError(400, "Invalid or expired OTP.");
  }

  await verifyOtp(email, otp, "verify_email"); // throws ApiError on failure

  user.isEmailVerified = true;
  await _issueAndRotate(res, user); // saves user with new refreshTokenHash
  await delCache(USER_CACHE_KEY(user._id));

  res.status(200).json(
    new ApiResponse(200, { user: _safeUser(user) }, "Email verified. You are now logged in.")
  );
});

export const resendOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  // Never reveal whether an account exists
  if (!user || user.isEmailVerified) {
    return res
      .status(200)
      .json(new ApiResponse(200, null, "If applicable, a new OTP has been sent."));
  }

  await createAndSendOtp(email, "verify_email");

  res.status(200).json(new ApiResponse(200, null, "OTP resent. Check your email."));
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select("+password +refreshTokenHash");
  if (!user) throw new ApiError(401, "Invalid email or password.");

  const match = await user.comparePassword(password);
  if (!match) throw new ApiError(401, "Invalid email or password.");

  if (!user.isEmailVerified) {
    throw new ApiError(403, "Please verify your email before logging in.");
  }

  if (user.status === "suspended") {
    throw new ApiError(403, "Your account has been suspended. Please contact support.");
  }

  await _issueAndRotate(res, user);
  await delCache(USER_CACHE_KEY(user._id));

  res.status(200).json(
    new ApiResponse(200, { user: _safeUser(user) }, "Logged in successfully.")
  );
});

export const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (!token) throw new ApiError(401, "No refresh token provided.");

  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    throw new ApiError(401, "Invalid or expired refresh token.");
  }

  const user = await User.findById(payload.sub).select("+refreshTokenHash");
  if (!user) throw new ApiError(401, "User not found.");
  if (!user.isEmailVerified) throw new ApiError(403, "Email not verified.");
  if (user.status === "suspended") {
    user.refreshTokenHash = null;
    await user.save();
    clearAuthCookies(res);
    await delCache(USER_CACHE_KEY(user._id));
    throw new ApiError(403, "Your account has been suspended. Please contact support.");
  }

  // Token reuse detection: compare cookie token against stored hash
  const isValid = await user.compareRefreshToken(token);
  if (!isValid) {
    // Possible token reuse — invalidate everything
    user.refreshTokenHash = null;
    await user.save();
    clearAuthCookies(res);
    await delCache(USER_CACHE_KEY(user._id));
    throw new ApiError(401, "Session expired. Please log in again.");
  }

  await _issueAndRotate(res, user);
  await delCache(USER_CACHE_KEY(user._id));

  res.status(200).json(new ApiResponse(200, null, "Token refreshed."));
});

export const logout = asyncHandler(async (req, res) => {
  // Clear the stored hash so the refresh token can never be reused
  const token = req.cookies?.[REFRESH_COOKIE];
  if (token) {
    try {
      const payload = verifyRefreshToken(token);
      const user = await User.findById(payload.sub).select("+refreshTokenHash");
      if (user) {
        user.refreshTokenHash = null;
        await user.save();
        await delCache(USER_CACHE_KEY(user._id));
      }
    } catch {
      // Expired/invalid token — still clear cookies
    }
  }

  clearAuthCookies(res);
  res.status(200).json(new ApiResponse(200, null, "Logged out successfully."));
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  // Always return the same message to prevent user enumeration
  if (user && user.isEmailVerified) {
    await createAndSendOtp(email, "reset_password");
  }

  res
    .status(200)
    .json(new ApiResponse(200, null, "If an account exists, a password reset OTP has been sent."));
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { email, otp, newPassword } = req.body;

  // Anti-enumeration: same error for wrong user OR wrong OTP
  const user = await User.findOne({ email }).select("+refreshTokenHash");

  if (!user) {
    try { await verifyOtp(email, otp, "reset_password"); } catch { /* ignored */ }
    throw new ApiError(400, "Invalid or expired OTP.");
  }

  await verifyOtp(email, otp, "reset_password"); // throws on failure

  user.password = newPassword;   // pre-save hook will hash it
  user.refreshTokenHash = null;  // invalidate all existing sessions
  await user.save();

  clearAuthCookies(res);
  await delCache(USER_CACHE_KEY(user._id));

  res.status(200).json(new ApiResponse(200, null, "Password reset successfully. Please log in."));
});

export const getMe = asyncHandler(async (req, res) => {
  // req.user is already populated by protect middleware (with cache)
  res.status(200).json(new ApiResponse(200, _safeUser(req.user)));
});
