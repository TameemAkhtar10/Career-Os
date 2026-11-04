import { Router } from "express";
import rateLimit from "express-rate-limit";

import validate from "../middlewares/validate.middleware.js";
import { protect } from "../middlewares/auth.middleware.js";
import cacheResponse from "../middlewares/cache.middleware.js";
import { getRedis } from "../config/redis.js";
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

const makeLimiter = (max, message) => {
  const options = {
    windowMs: 15 * 60 * 1000,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message },
    // Store is resolved lazily; if Redis isn't ready yet we get in-memory.
    skip: () => false,
  };

  // Attach Redis store only if Redis is configured
  const redis = getRedis();
  if (redis) {
    // Dynamically import to avoid hard-crashing when the package isn't installed
    import("rate-limit-redis").then(({ default: RedisStore }) => {
      options.store = new RedisStore({ sendCommand: (...args) => redis.call(...args) });
    }).catch(() => {
      // rate-limit-redis not installed — silently use in-memory
    });
  }

  return rateLimit(options);
};

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
