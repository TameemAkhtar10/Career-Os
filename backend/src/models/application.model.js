import mongoose from "mongoose";

const statusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: {
        values: ["applied", "shortlisted", "rejected", "hired", "withdrawn"],
        message: "Status must be applied, shortlisted, rejected, hired, or withdrawn",
      },
      required: true,
    },
    at: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const applicationSchema = new mongoose.Schema(
  {
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: [true, "Job reference is required"],
      index: true,
    },
    candidate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Candidate reference is required"],
      index: true,
    },
    recruiter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Recruiter reference is required"],
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: ["applied", "shortlisted", "rejected", "hired", "withdrawn"],
        message: "Status must be applied, shortlisted, rejected, hired, or withdrawn",
      },
      default: "applied",
    },
    coverNote: {
      type: String,
      trim: true,
      maxlength: [1000, "Cover note cannot exceed 1000 characters"],
      default: "",
    },
    matchScore: {
      type: Number,
      min: [0, "Match score cannot be less than 0"],
      max: [100, "Match score cannot be greater than 100"],
      default: 0,
    },
    recruiterNote: {
      type: String,
      trim: true,
      maxlength: [500, "Recruiter note cannot exceed 500 characters"],
      default: "",
    },
    statusHistory: {
      type: [statusHistorySchema],
      default: () => [{ status: "applied", at: new Date() }],
    },
  },
  { timestamps: true }
);

// Indexes
// Unique compound index: candidate can apply only once per job
applicationSchema.index({ job: 1, candidate: 1 }, { unique: true });
applicationSchema.index({ job: 1, status: 1 });

export const Application = mongoose.model("Application", applicationSchema);
