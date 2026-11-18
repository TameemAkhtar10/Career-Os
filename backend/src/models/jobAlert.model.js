import mongoose from "mongoose";

const jobAlertFiltersSchema = new mongoose.Schema(
  {
    q: {
      type: String,
      trim: true,
      default: "",
    },
    skills: {
      type: [String],
      default: [],
    },
    location: {
      type: String,
      trim: true,
      default: "",
    },
    workMode: {
      type: String,
      enum: ["", "onsite", "remote", "hybrid"],
      default: "",
    },
    jobType: {
      type: String,
      enum: ["", "full_time", "internship", "part_time", "contract"],
      default: "",
    },
    fresher: {
      type: Boolean,
      default: false,
    },
    minSalary: {
      type: Number,
      default: null,
    },
  },
  { _id: false }
);

const jobAlertSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
      index: true,
    },
    name: {
      type: String,
      required: [true, "Alert name is required"],
      trim: true,
      maxlength: [100, "Alert name cannot exceed 100 characters"],
    },
    filters: {
      type: jobAlertFiltersSchema,
      default: () => ({}),
    },
    frequency: {
      type: String,
      enum: ["daily", "weekly"],
      default: "daily",
    },
    active: {
      type: Boolean,
      default: true,
    },
    lastSentAt: {
      type: Date,
      default: null,
    },
    lastCheckedAt: {
      type: Date,
      default: Date.now,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
    versionKey: false,
  }
);

// Compound index on (active, frequency) for fast cron queries
jobAlertSchema.index({ active: 1, frequency: 1 });
jobAlertSchema.index({ user: 1, createdAt: -1 });

export const JobAlert = mongoose.model("JobAlert", jobAlertSchema);
