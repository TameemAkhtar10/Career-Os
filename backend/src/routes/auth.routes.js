import { Router } from "express";
import rateLimit from "express-rate-limit";

import validate from "../middlewares/validate.middleware.js";
import { protect } from "../middlewares/auth.middleware.js";
import cacheResponse from "../middlewares/cache.middleware.js";
import { getRateLimitStore } from "../config/redis.js";
import {
  registerSchema,
  verifyEmailSchema,
  resendOtpSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "../validators/auth.schemas.js";
import {
  register,
  verifyEmail,
  resendOtp,
  login,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
  getMe,
} from "../controllers/auth.controller.js";

const router = Router();

// ── Rate limiter factory ──────────────────────────────────────────────────────
// Uses Redis store when available, falls back to in-memory automatically.

const makeLimiter = (max, message, prefix = "rl:auth:") =>
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    store: getRateLimitStore(prefix),
    message: { success: false, message },
  });

/** General auth limiter: 20 requests / 15 min */
const authLimiter = makeLimiter(20, "Too many requests. Please try again later.");

/** Stricter limiter for OTP-sending endpoints: 5 requests / 15 min */
const otpLimiter = makeLimiter(5, "Too many OTP requests. Please try again later.");

// ── /me cache key: scoped to the authenticated user ──────────────────────────
const meCacheKey = (req) => `cache:/api/auth/me:${req.user?._id}`;

// ── Routes ────────────────────────────────────────────────────────────────────

router.post("/register",        otpLimiter,  validate(registerSchema),        register);
router.post("/verify-email",    authLimiter, validate(verifyEmailSchema),     verifyEmail);
router.post("/resend-otp",      otpLimiter,  validate(resendOtpSchema),       resendOtp);
router.post("/login",           authLimiter, validate(loginSchema),           login);
router.post("/refresh",         authLimiter,                                  refresh);
router.post("/logout",          authLimiter,                                  logout);
router.post("/forgot-password", otpLimiter,  validate(forgotPasswordSchema),  forgotPassword);
router.post("/reset-password",  authLimiter, validate(resetPasswordSchema),   resetPassword);

router.get(
  "/me",
  protect,
  cacheResponse({ ttl: 5 * 60, keyBuilder: meCacheKey }),
  getMe
);

export default router;
