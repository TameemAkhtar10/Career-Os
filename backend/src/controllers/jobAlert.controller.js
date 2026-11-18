import mongoose from "mongoose";
import { JobAlert } from "../models/jobAlert.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { verifyPauseAlertToken } from "../services/alertToken.service.js";

const MAX_JOB_ALERTS = 5;

/**
 * POST /api/job-alerts (candidate only)
 * Creates a new job search alert. Max 5 alerts per candidate.
 */
export const createJobAlert = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { name, filters = {}, frequency = "daily" } = req.body;

  const count = await JobAlert.countDocuments({ user: userId });
  if (count >= MAX_JOB_ALERTS) {
    throw new ApiError(
      400,
      `You can create a maximum of ${MAX_JOB_ALERTS} job alerts. Please delete or update an existing alert.`
    );
  }

  const alert = await JobAlert.create({
    user: userId,
    name: name.trim(),
    filters: {
      q: filters.q || "",
      skills: Array.isArray(filters.skills) ? filters.skills : [],
      location: filters.location || "",
      workMode: filters.workMode || "",
      jobType: filters.jobType || "",
      fresher: Boolean(filters.fresher),
      minSalary: filters.minSalary != null ? Number(filters.minSalary) : null,
    },
    frequency,
    active: true,
    lastSentAt: null,
    lastCheckedAt: new Date(),
  });

  res.status(201).json(
    new ApiResponse(201, alert, "Job alert created successfully.")
  );
});

/**
 * GET /api/job-alerts (candidate only)
 * Returns all job alerts for the candidate.
 */
export const getMyJobAlerts = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const alerts = await JobAlert.find({ user: userId })
    .sort({ createdAt: -1 })
    .lean();

  res.status(200).json(
    new ApiResponse(200, alerts, "Job alerts fetched successfully.")
  );
});

/**
 * PATCH /api/job-alerts/:id (candidate only)
 * Updates name, filters, frequency, or active status of own alert.
 */
export const updateJobAlert = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { id } = req.params;
  const { name, filters, frequency, active } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid alert ID.");
  }

  const alert = await JobAlert.findOne({ _id: id, user: userId });
  if (!alert) {
    throw new ApiError(404, "Job alert not found.");
  }

  if (name !== undefined) alert.name = name.trim();
  if (frequency !== undefined) alert.frequency = frequency;
  if (active !== undefined) alert.active = Boolean(active);

  if (filters && typeof filters === "object") {
    alert.filters = {
      q: filters.q !== undefined ? filters.q : alert.filters.q,
      skills: Array.isArray(filters.skills) ? filters.skills : alert.filters.skills,
      location: filters.location !== undefined ? filters.location : alert.filters.location,
      workMode: filters.workMode !== undefined ? filters.workMode : alert.filters.workMode,
      jobType: filters.jobType !== undefined ? filters.jobType : alert.filters.jobType,
      fresher: filters.fresher !== undefined ? Boolean(filters.fresher) : alert.filters.fresher,
      minSalary: filters.minSalary !== undefined ? filters.minSalary : alert.filters.minSalary,
    };
  }

  await alert.save();

  res.status(200).json(
    new ApiResponse(200, alert, "Job alert updated successfully.")
  );
});

/**
 * DELETE /api/job-alerts/:id (candidate only)
 * Deletes own alert.
 */
export const deleteJobAlert = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid alert ID.");
  }

  const result = await JobAlert.findOneAndDelete({ _id: id, user: userId });
  if (!result) {
    throw new ApiError(404, "Job alert not found.");
  }

  res.status(200).json(
    new ApiResponse(200, { deleted: true, id }, "Job alert deleted successfully.")
  );
});

/**
 * POST or GET /api/job-alerts/pause
 * Public one-click pause via signed token (no login needed).
 */
export const pauseAlertWithToken = asyncHandler(async (req, res) => {
  const token = req.body?.token || req.query?.token;

  if (!token || typeof token !== "string") {
    throw new ApiError(400, "Invalid or missing token.");
  }

  const { alertId, userId } = verifyPauseAlertToken(token);

  const alert = await JobAlert.findOne({ _id: alertId, user: userId });
  if (!alert) {
    throw new ApiError(404, "Job alert not found or already deleted.");
  }

  alert.active = false;
  await alert.save();

  res.status(200).json(
    new ApiResponse(
      200,
      { paused: true, alertId: alert._id, name: alert.name },
      `Job alert "${alert.name}" has been paused.`
    )
  );
});
