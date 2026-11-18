import mongoose from "mongoose";

const coverLetterDailyCountSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    dateKey: {
      type: String, // YYYY-MM-DD in Asia/Kolkata
      required: true,
    },
    count: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Atomic unique compound index per user per date
coverLetterDailyCountSchema.index({ user: 1, dateKey: 1 }, { unique: true });

export const CoverLetterDailyCount = mongoose.model(
  "CoverLetterDailyCount",
  coverLetterDailyCountSchema
);
