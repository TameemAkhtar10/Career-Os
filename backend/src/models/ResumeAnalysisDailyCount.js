import mongoose from "mongoose";

const resumeAnalysisDailyCountSchema = new mongoose.Schema(
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
resumeAnalysisDailyCountSchema.index({ user: 1, dateKey: 1 }, { unique: true });

export const ResumeAnalysisDailyCount = mongoose.model(
  "ResumeAnalysisDailyCount",
  resumeAnalysisDailyCountSchema
);

