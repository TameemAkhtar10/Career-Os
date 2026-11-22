import mongoose from "mongoose";

const cronJobLockSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Job name is required"],
      unique: true,
      trim: true,
      index: true,
    },
    schedule: {
      type: String,
      required: [true, "Cron schedule is required"],
      trim: true,
    },
    timezone: {
      type: String,
      default: "Asia/Kolkata",
      trim: true,
    },
    lockedAt: {
      type: Date,
      default: null,
      index: true,
    },
    lockedBy: {
      type: String,
      default: null,
      trim: true,
    },
    running: {
      type: Boolean,
      default: false,
      index: true,
    },
    lastPeriodKey: {
      type: String,
      default: null,
      index: true,
    },
    lastRunAt: {
      type: Date,
      default: null,
    },
    lastFinishedAt: {
      type: Date,
      default: null,
    },
    lastDurationMs: {
      type: Number,
      default: null,
    },
    lastResult: {
      type: String,
      enum: ["ok", "error", "skipped", null],
      default: null,
    },
    lastStats: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    lastError: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "cron_job_locks",
  }
);

export const CronJobLock = mongoose.model("CronJobLock", cronJobLockSchema);
