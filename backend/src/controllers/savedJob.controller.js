import mongoose from "mongoose";
import { SavedJob } from "../models/savedJob.model.js";
import { Job } from "../models/job.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const MAX_SAVED_JOBS = 100;

/**
 * POST /api/saved-jobs/:jobId (candidate only)
 * Saves/bookmarks a job. Limit 100 per candidate.
 */
export const saveJob = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { jobId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(jobId)) {
    throw new ApiError(400, "Invalid job ID.");
  }

  // Verify job exists
  const job = await Job.findById(jobId).select("_id status").lean();
  if (!job) {
    throw new ApiError(404, "Job not found.");
  }

  // Check if already saved
  const existing = await SavedJob.findOne({ user: userId, job: jobId });
  if (existing) {
    return res.status(200).json(
      new ApiResponse(200, { saved: true, savedJobId: existing._id }, "Job is already saved.")
    );
  }

  // Check 100-saved-jobs limit
  const count = await SavedJob.countDocuments({ user: userId });
  if (count >= MAX_SAVED_JOBS) {
    throw new ApiError(
      400,
      `You can save a maximum of ${MAX_SAVED_JOBS} jobs. Please remove some saved jobs to save more.`
    );
  }

  const savedJob = await SavedJob.create({
    user: userId,
    job: jobId,
  });

  res.status(201).json(
    new ApiResponse(201, { saved: true, savedJobId: savedJob._id }, "Job saved successfully.")
  );
});

/**
 * DELETE /api/saved-jobs/:jobId (candidate only)
 * Removes a saved job bookmark.
 */
export const unsaveJob = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { jobId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(jobId)) {
    throw new ApiError(400, "Invalid job ID.");
  }

  await SavedJob.findOneAndDelete({ user: userId, job: jobId });

  res.status(200).json(
    new ApiResponse(200, { saved: false }, "Job removed from saved jobs.")
  );
});

/**
 * GET /api/saved-jobs (candidate only, paginated)
 * Returns the candidate's saved jobs with job summary and closed/expired flags.
 */
export const getSavedJobs = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
  const skip = (page - 1) * limit;

  const [rawItems, total] = await Promise.all([
    SavedJob.find({ user: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({
        path: "job",
        select:
          "title companyName location workMode jobType salary skills isFresherFriendly status applicationDeadline createdAt",
      })
      .lean(),
    SavedJob.countDocuments({ user: userId }),
  ]);

  const now = new Date();

  // Flag closed or expired jobs while preserving row
  const items = rawItems.map((item) => {
    const job = item.job;
    const isDeleted = !job;
    const isDeadlinePassed = Boolean(
      job?.applicationDeadline && new Date(job.applicationDeadline).getTime() < now.getTime()
    );
    const isClosed = isDeleted || job.status !== "open" || isDeadlinePassed;

    return {
      _id: item._id,
      savedAt: item.createdAt,
      isClosed,
      isExpired: isDeadlinePassed,
      isDeleted,
      job: job
        ? {
            _id: job._id,
            title: job.title,
            companyName: job.companyName,
            location: job.location,
            workMode: job.workMode,
            jobType: job.jobType,
            salary: job.salary,
            skills: job.skills || [],
            isFresherFriendly: Boolean(job.isFresherFriendly),
            status: job.status,
            applicationDeadline: job.applicationDeadline,
            createdAt: job.createdAt,
          }
        : null,
    };
  });

  const totalPages = Math.ceil(total / limit) || 1;

  res.status(200).json(
    new ApiResponse(
      200,
      { savedJobs: items, page, limit, total, totalPages },
      "Saved jobs retrieved successfully."
    )
  );
});

/**
 * GET /api/saved-jobs/ids (candidate only)
 * Fast endpoint returning array of saved job IDs for quick heart icons status.
 */
export const getSavedJobIds = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const ids = await SavedJob.find({ user: userId }).distinct("job");

  res.status(200).json(
    new ApiResponse(200, ids.map(String), "Saved job IDs retrieved successfully.")
  );
});
