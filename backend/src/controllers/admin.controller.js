import mongoose from "mongoose";
import { User } from "../models/user.model.js";
import { Job } from "../models/job.model.js";
import { Application } from "../models/application.model.js";
import { RecruiterProfile } from "../models/recruiterProfile.model.js";
import { AuditLog, logAdminAction } from "../models/auditLog.model.js";
import { CronRun } from "../models/cronRun.model.js";
import { getJobRunner } from "../jobs/index.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { delCache, delByPrefix } from "../utils/cache.js";

const escapeRegex = (str = "") => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * GET /api/admin/stats
 * Returns system-wide metrics and aggregates.
 */
export const getStats = asyncHandler(async (_req, res) => {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    candidatesCount,
    recruitersCount,
    adminsCount,
    signupsLast7Days,
    totalJobs,
    openJobs,
    closedJobs,
    draftJobs,
    totalApplications,
    appliedApps,
    shortlistedApps,
    rejectedApps,
    hiredApps,
    withdrawnApps,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: "candidate" }),
    User.countDocuments({ role: "recruiter" }),
    User.countDocuments({ role: "admin" }),
    User.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
    Job.countDocuments(),
    Job.countDocuments({ status: "open" }),
    Job.countDocuments({ status: "closed" }),
    Job.countDocuments({ status: "draft" }),
    Application.countDocuments(),
    Application.countDocuments({ status: "applied" }),
    Application.countDocuments({ status: "shortlisted" }),
    Application.countDocuments({ status: "rejected" }),
    Application.countDocuments({ status: "hired" }),
    Application.countDocuments({ status: "withdrawn" }),
  ]);

  const stats = {
    users: {
      total: totalUsers,
      candidates: candidatesCount,
      recruiters: recruitersCount,
      admins: adminsCount,
      signupsLast7Days,
    },
    jobs: {
      total: totalJobs,
      open: openJobs,
      closed: closedJobs,
      draft: draftJobs,
    },
    applications: {
      total: totalApplications,
      applied: appliedApps,
      shortlisted: shortlistedApps,
      rejected: rejectedApps,
      hired: hiredApps,
      withdrawn: withdrawnApps,
    },
  };

  res.status(200).json(new ApiResponse(200, stats, "Admin statistics fetched successfully."));
});

/**
 * GET /api/admin/users
 * Paginated list of users with optional role, status, and search filters.
 */
export const getUsers = asyncHandler(async (req, res) => {
  const { role, status, q } = req.query;

  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
  const skip = (page - 1) * limit;

  const filter = {};
  if (role && ["candidate", "recruiter", "admin"].includes(role)) {
    filter.role = role;
  }
  if (status && ["active", "suspended"].includes(status)) {
    filter.status = status;
  }
  if (q && typeof q === "string" && q.trim().length > 0) {
    const safeQ = escapeRegex(q.trim());
    filter.$or = [
      { name: { $regex: safeQ, $options: "i" } },
      { email: { $regex: safeQ, $options: "i" } },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(filter)
      .select("_id name email role status isEmailVerified createdAt updatedAt")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(total / limit) || 1;

  res.status(200).json(
    new ApiResponse(
      200,
      { users, page, limit, total, totalPages },
      "Users fetched successfully."
    )
  );
});

/**
 * PATCH /api/admin/users/:id/status
 * Updates user account status (active | suspended).
 * Cannot suspend self or another admin. Clears refresh tokens when suspended.
 */
export const updateUserStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid user ID.");
  }

  const targetUser = await User.findById(id).select("+refreshTokenHash");
  if (!targetUser) {
    throw new ApiError(404, "User not found.");
  }

  if (String(targetUser._id) === String(req.user._id)) {
    throw new ApiError(400, "You cannot modify the status of your own account.");
  }

  if (targetUser.role === "admin") {
    throw new ApiError(400, "Cannot modify the status of another administrator.");
  }

  const previousStatus = targetUser.status;
  targetUser.status = status;

  if (status === "suspended") {
    // Invalidate any active session immediately
    targetUser.refreshTokenHash = null;
  }

  await targetUser.save();
  await delCache(`user:${id}`);

  await logAdminAction({
    adminId: req.user._id,
    action: "update_user_status",
    targetType: "User",
    targetId: targetUser._id,
    meta: { previousStatus, newStatus: status },
  });

  const responseUser = {
    _id: targetUser._id,
    name: targetUser.name,
    email: targetUser.email,
    role: targetUser.role,
    status: targetUser.status,
    isEmailVerified: targetUser.isEmailVerified,
    updatedAt: targetUser.updatedAt,
  };

  res.status(200).json(
    new ApiResponse(200, responseUser, `User status updated to ${status}.`)
  );
});

/**
 * GET /api/admin/jobs
 * Paginated list of all jobs across statuses with applicant count and recruiter details.
 */
export const getJobs = asyncHandler(async (req, res) => {
  const { status, q, recruiterId } = req.query;

  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
  const skip = (page - 1) * limit;

  const filter = {};
  if (status && ["open", "closed", "draft"].includes(status)) {
    filter.status = status;
  }
  if (recruiterId && mongoose.Types.ObjectId.isValid(recruiterId)) {
    filter.recruiter = recruiterId;
  }
  if (q && typeof q === "string" && q.trim().length > 0) {
    const safeQ = escapeRegex(q.trim());
    filter.$or = [
      { title: { $regex: safeQ, $options: "i" } },
      { companyName: { $regex: safeQ, $options: "i" } },
    ];
  }

  const [rawJobs, total] = await Promise.all([
    Job.find(filter)
      .populate("recruiter", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Job.countDocuments(filter),
  ]);

  const jobIds = rawJobs.map((j) => j._id);
  const appCounts = await Application.aggregate([
    { $match: { job: { $in: jobIds } } },
    { $group: { _id: "$job", count: { $sum: 1 } } },
  ]);

  const countMap = new Map(appCounts.map((c) => [String(c._id), c.count]));

  const jobs = rawJobs.map((j) => ({
    ...j,
    applicantCount: countMap.get(String(j._id)) || 0,
  }));

  const totalPages = Math.ceil(total / limit) || 1;

  res.status(200).json(
    new ApiResponse(
      200,
      { jobs, page, limit, total, totalPages },
      "Admin jobs fetched successfully."
    )
  );
});

/**
 * PATCH /api/admin/jobs/:id/status
 * Administrative override for job status.
 */
export const updateJobStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid job ID.");
  }

  const job = await Job.findById(id);
  if (!job) {
    throw new ApiError(404, "Job not found.");
  }

  const previousStatus = job.status;
  job.status = status;
  await job.save();

  await delByPrefix("cache:jobs:");

  await logAdminAction({
    adminId: req.user._id,
    action: "update_job_status",
    targetType: "Job",
    targetId: job._id,
    meta: { previousStatus, newStatus: status, title: job.title },
  });

  res.status(200).json(
    new ApiResponse(200, job, `Job status updated to ${status}.`)
  );
});

/**
 * PATCH /api/admin/recruiters/:userId/verify
 * Sets verification badge status for a recruiter.
 */
export const verifyRecruiter = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { isVerified } = req.body;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, "Invalid user ID.");
  }

  const recruiterUser = await User.findById(userId);
  if (!recruiterUser || recruiterUser.role !== "recruiter") {
    throw new ApiError(404, "Recruiter user not found.");
  }

  const profile = await RecruiterProfile.findOneAndUpdate(
    { user: userId },
    { isVerified: Boolean(isVerified) },
    { returnDocument: "after", upsert: true, setDefaultsOnInsert: true }
  );

  await delByPrefix(`cache:profile:recruiter:${userId}`);
  await delByPrefix("cache:jobs:");

  await logAdminAction({
    adminId: req.user._id,
    action: "verify_recruiter",
    targetType: "RecruiterProfile",
    targetId: profile._id,
    meta: { recruiterUserId: userId, isVerified: Boolean(isVerified) },
  });

  res.status(200).json(
    new ApiResponse(
      200,
      { userId, isVerified: profile.isVerified },
      `Recruiter verification set to ${profile.isVerified}.`
    )
  );
});

/**
 * GET /api/admin/audit-logs
 * Paginated list of admin audit trail records.
 */
export const getAuditLogs = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
  const skip = (page - 1) * limit;

  const [auditLogs, total] = await Promise.all([
    AuditLog.find()
      .populate("admin", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    AuditLog.countDocuments(),
  ]);

  const totalPages = Math.ceil(total / limit) || 1;

  res.status(200).json(
    new ApiResponse(
      200,
      { auditLogs, page, limit, total, totalPages },
      "Audit logs fetched successfully."
    )
  );
});

/**
 * GET /api/admin/cron-runs
 * Paginated list of scheduled task runs, filterable by task.
 */
export const getCronRuns = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const skip = (page - 1) * limit;

  const query = {};
  if (req.query.task && typeof req.query.task === "string") {
    query.task = req.query.task.trim();
  }

  const [runs, total] = await Promise.all([
    CronRun.find(query)
      .sort({ startedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    CronRun.countDocuments(query),
  ]);

  const totalPages = Math.ceil(total / limit) || 1;

  res.status(200).json(
    new ApiResponse(
      200,
      { runs, page, limit, total, totalPages },
      "Cron runs fetched successfully."
    )
  );
});

/**
 * POST /api/admin/cron/:task/run
 * Manually triggers a cron task immediately with a forced key.
 * Audit-logged.
 */
export const triggerCronTask = asyncHandler(async (req, res) => {
  const { task } = req.params;
  const dryRun = Boolean(req.body.dryRun);

  const runner = getJobRunner(task);
  if (!runner) {
    throw new ApiError(
      400,
      `Unknown task '${task}'. Supported tasks: job-digest, recruiter-digest, job-auto-close, profile-nudge.`
    );
  }

  // Run immediately with force: true so manual run gets a unique key suffix
  const result = await runner({ dryRun, force: true });

  // Audit log the admin action
  await logAdminAction({
    adminId: req.user._id,
    action: "TRIGGER_CRON_TASK",
    targetType: "CronRun",
    targetId: req.user._id,
    meta: {
      task,
      dryRun,
      status: result.status,
      stats: result.stats,
      note: result.note || result.error || null,
    },
  });

  res.status(200).json(
    new ApiResponse(
      200,
      result,
      `Task '${task}' ${dryRun ? "simulated (dry run)" : "executed"} successfully.`
    )
  );
});
