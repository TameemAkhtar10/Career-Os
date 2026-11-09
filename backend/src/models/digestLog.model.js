import mongoose from "mongoose";

const digestLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
      index: true,
    },
    sentAt: {
      type: Date,
      default: Date.now,
      expires: 30 * 24 * 60 * 60, // 30-day TTL index
    },
  },
  { timestamps: false }
);

// Prevent duplicate entries for the same user and job
digestLogSchema.index({ user: 1, job: 1 }, { unique: true });

export const DigestLog = mongoose.model("DigestLog", digestLogSchema);

