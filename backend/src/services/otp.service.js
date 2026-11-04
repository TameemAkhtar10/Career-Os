import crypto from "crypto";
import bcrypt from "bcrypt";
import { Otp } from "../models/otp.model.js";
import { ApiError } from "../utils/ApiError.js";
import { sendOtpEmail } from "./email.service.js";

const OTP_TTL_MS = 5 * 60 * 1000;       // 5 minutes
const OTP_RESEND_COOLDOWN_MS = 60 * 1000; // 60 seconds
const MAX_ATTEMPTS = 5;
const SALT_ROUNDS = 10;

/**
 * Generate, store (hashed), and email a new OTP.
 * Enforces a 60-second resend cooldown.
 */
export const createAndSendOtp = async (email, purpose) => {
  const existing = await Otp.findOne({ email, purpose });

  // Enforce resend cooldown
  if (existing) {
    const cooldownEnds = new Date(existing.lastSentAt.getTime() + OTP_RESEND_COOLDOWN_MS);
    if (new Date() < cooldownEnds) {
      const secondsLeft = Math.ceil((cooldownEnds - new Date()) / 1000);
      throw new ApiError(429, `Please wait ${secondsLeft}s before requesting a new OTP.`);
    }
  }

  // Generate 6-digit OTP using cryptographically secure random
  const otp = crypto.randomInt(100000, 999999);
  const otpHash = await bcrypt.hash(String(otp), SALT_ROUNDS);

  const expiresAt = new Date(Date.now() + OTP_TTL_MS);
  const now = new Date();

  await Otp.findOneAndReplace(
    { email, purpose },
    { email, purpose, otpHash, attempts: 0, expiresAt, lastSentAt: now },
    { upsert: true, returnDocument: "after" }
  );

  await sendOtpEmail(email, otp, purpose);
};

/**
 * Verify an OTP for a given email + purpose.
 * Increments attempt count. Throws on wrong OTP, expired, or too many attempts.
 * Deletes the OTP document on success.
 */
export const verifyOtp = async (email, candidate, purpose) => {
  const record = await Otp.findOne({ email, purpose });

  if (!record) {
    throw new ApiError(400, "OTP not found or has expired. Please request a new one.");
  }

  if (record.expiresAt < new Date()) {
    await record.deleteOne();
    throw new ApiError(400, "OTP expired");
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    await record.deleteOne();
    throw new ApiError(429, "Too many incorrect attempts. Please request a new OTP.");
  }

  const isValid = await record.verifyOtp(candidate);

  if (!isValid) {
    record.attempts += 1;
    await record.save();
    const remaining = MAX_ATTEMPTS - record.attempts;
    throw new ApiError(
      400,
      `Invalid OTP. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`
    );
  }

  // OTP is correct — clean up immediately
  await record.deleteOne();
};
