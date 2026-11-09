import mongoose from "mongoose";

const statsSchema = new mongoose.Schema(
  {
    eligible: { type: Number, default: 0 },
    sent: { type: Number, default: 0 },
    skipped: { type: Number, default: 0 },
    failed: { type: Number, default: 0 },
  },
  { _id: false }
);

const cronRunSchema = new mongoose.Schema(
  {
    task: {
      type: String,
      required: [true, "Task name is required"],
      trim: true,
      index: true,
    },
    key: {
      type: String,
      required: [true, "Run key is required"],
      unique: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["running", "done", "failed", "skipped"],
      default: "running",
      index: true,
    },
    startedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    finishedAt: {
      type: Date,
      default: null,
    },
    stats: {
      type: statsSchema,
      default: () => ({ eligible: 0, sent: 0, skipped: 0, failed: 0 }),
    },
    dryRun: {
      type: Boolean,
      default: false,
    },
    error: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

cronRunSchema.index({ startedAt: -1 });

export const CronRun = mongoose.model("CronRun", cronRunSchema);

