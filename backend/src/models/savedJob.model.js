import mongoose from "mongoose";

const savedJobSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
      index: true,
    },
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: [true, "Job reference is required"],
      index: true,
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

// Unique compound index on (user, job) to prevent duplicate bookmarks
savedJobSchema.index({ user: 1, job: 1 }, { unique: true });

export const SavedJob = mongoose.model("SavedJob", savedJobSchema);
