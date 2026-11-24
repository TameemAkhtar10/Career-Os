import mongoose from "mongoose";
import bcrypt from "bcrypt";

const SALT_ROUNDS = 12;

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [
        function () {
          return !this.googleId;
        },
        "Password is required",
      ],
      minlength: [8, "Password must be at least 8 characters"],
      select: false,
    },
    googleId: {
      type: String,
      sparse: true,
      unique: true,
      select: false,
      default: undefined,
    },
    authProviders: {
      type: [String],
      enum: ["password", "google"],
      default: function () {
        const providers = [];
        if (this.password) providers.push("password");
        if (this.googleId) providers.push("google");
        return providers.length ? providers : ["password"];
      },
    },
    role: {
      type: String,
      enum: ["candidate", "recruiter", "admin"],
      default: "candidate",
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["active", "suspended"],
      default: "active",
    },
    emailPreferences: {
      jobAlerts: {
        type: Boolean,
        default: true,
      },
      applicantDigest: {
        type: Boolean,
        default: true,
      },
      profileNudges: {
        type: Boolean,
        default: true,
      },
      trackerReminders: {
        type: Boolean,
        default: true,
      },
    },
    aiConsent: {
      resumeAnalysis: {
        granted: {
          type: Boolean,
          default: false,
        },
        at: {
          type: Date,
          default: null,
        },
        version: {
          type: String,
          default: null,
        },
      },
    },
    // Bcrypt hash of the current refresh token — used for rotation & reuse detection.
    // select:false so it is never returned in queries unless explicitly requested.
    refreshTokenHash: {
      type: String,
      select: false,
      default: null,
    },
  },
  { timestamps: true }
);

// Hash password before saving (only when modified)
// Mongoose 8+ async hooks: no `next` param — use return for early exit, throw for errors.
userSchema.pre("save", async function () {
  if (!this.isModified("password") || !this.password) return;
  this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
});

// Compare raw password with stored hash
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// Compare a raw refresh token with the stored hash
userSchema.methods.compareRefreshToken = async function (token) {
  if (!this.refreshTokenHash) return false;
  return bcrypt.compare(token, this.refreshTokenHash);
};

export const CONSENT_VERSION = "1.0";

export const User = mongoose.model("User", userSchema);
