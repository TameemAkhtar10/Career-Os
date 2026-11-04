import mongoose from "mongoose";
import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true,
  },
  otpHash: {
    type: String,
    required: true,
  },
  purpose: {
    type: String,
    enum: ["verify_email", "reset_password"],
    required: true,
  },
  attempts: {
    type: Number,
    default: 0,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
  lastSentAt: {
    type: Date,
    default: Date.now,
  },
});

// TTL index: MongoDB deletes documents 1 hour (3600s) after expiresAt as a safety net.
// This grace period protects against clock skew between the app server and MongoDB Atlas;
// real 5-minute expiry is strictly enforced in application code.
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 3600 });

// Instance method: verify a candidate OTP against the stored hash
otpSchema.methods.verifyOtp = async function (candidate) {
  return bcrypt.compare(String(candidate), this.otpHash);
};

export const Otp = mongoose.model("Otp", otpSchema);
