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
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false,
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
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
});

// Compare raw password with stored hash
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Compare a raw refresh token with the stored hash
userSchema.methods.compareRefreshToken = async function (token) {
  if (!this.refreshTokenHash) return false;
  return bcrypt.compare(token, this.refreshTokenHash);
};

export const User = mongoose.model("User", userSchema);
