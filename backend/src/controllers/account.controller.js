import { User } from "../models/user.model.js";
import { CandidateProfile } from "../models/candidateProfile.model.js";
import { RecruiterProfile } from "../models/recruiterProfile.model.js";
import { Job } from "../models/job.model.js";
import { Application } from "../models/application.model.js";
import { Otp } from "../models/otp.model.js";
import { deleteFileFromImageKit } from "../services/imagekit.service.js";
import { deleteResumeFromGridFS } from "../services/gridfs.service.js";
import { clearAuthCookies } from "../services/token.service.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { delCache, delByPrefix } from "../utils/cache.js";

/**
 * DELETE /api/account
 * Permanently deletes user account, associated files, profiles, and references.
 * Requires password confirmation. Admin accounts cannot be self-deleted.
 */
export const deleteAccount = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { password } = req.body;

  const user = await User.findById(userId).select("+password");
  if (!user) {
    throw new ApiError(404, "User not found.");
  }

  if (user.role === "admin") {
    throw new ApiError(400, "Administrator accounts cannot be deleted through this endpoint.");
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new ApiError(401, "Invalid password.");
  }

  if (user.role === "candidate") {
    const candidateProfile = await CandidateProfile.findOne({ user: userId });
    if (candidateProfile?.resume?.fileId) {
      if (candidateProfile.resume.storage === "gridfs") {
        await deleteResumeFromGridFS(candidateProfile.resume.fileId);
      } else {
        await deleteFileFromImageKit(candidateProfile.resume.fileId);
      }
    }

    await Promise.all([
      CandidateProfile.deleteOne({ user: userId }),
      Application.deleteMany({ candidate: userId }),
      Otp.deleteMany({ email: user.email }),
      User.deleteOne({ _id: userId }),
    ]);
  } else if (user.role === "recruiter") {
    const recruiterProfile = await RecruiterProfile.findOne({ user: userId });
    if (recruiterProfile?.companyLogoFileId) {
      await deleteFileFromImageKit(recruiterProfile.companyLogoFileId);
    }

    await Promise.all([
      RecruiterProfile.deleteOne({ user: userId }),
      Job.updateMany({ recruiter: userId }, { status: "closed", recruiter: null }),
      Application.updateMany({ recruiter: userId }, { recruiter: null }),
      Otp.deleteMany({ email: user.email }),
      User.deleteOne({ _id: userId }),
    ]);
  }

  // Invalidate caches
  await delCache(`user:${userId}`);
  await delByPrefix("cache:jobs:");
  await delByPrefix("cache:applications:");
  await delByPrefix(`cache:profile:`);

  // Clear auth cookies
  clearAuthCookies(res);

  res.status(200).json(
    new ApiResponse(200, null, "Your account and all associated data have been permanently deleted.")
  );
});

/**
 * GET /api/account/export
 * Exports all user data in a portable JSON format (GDPR compliant).
 */
export const exportAccountData = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const user = await User.findById(userId)
    .select("_id name email role status isEmailVerified createdAt updatedAt")
    .lean();

  if (!user) {
    throw new ApiError(404, "User not found.");
  }

  let exportData = {
    exportedAt: new Date().toISOString(),
    user,
  };

  if (user.role === "candidate") {
    const [profile, applications] = await Promise.all([
      CandidateProfile.findOne({ user: userId }).lean(),
      Application.find({ candidate: userId })
        .populate("job", "title companyName location jobType workMode status")
        .lean(),
    ]);

    exportData.profile = profile || null;
    exportData.applications = applications;
  } else if (user.role === "recruiter") {
    const [profile, jobs] = await Promise.all([
      RecruiterProfile.findOne({ user: userId }).lean(),
      Job.find({ recruiter: userId }).lean(),
    ]);

    const jobIds = jobs.map((j) => j._id);
    const applications = await Application.find({ job: { $in: jobIds } })
      .select("job status coverNote matchScore recruiterNote statusHistory createdAt")
      .lean();

    exportData.profile = profile || null;
    exportData.jobs = jobs;
    exportData.applications = applications;
  }

  res.status(200).json(
    new ApiResponse(200, exportData, "Account data exported successfully.")
  );
});

/**
 * GET /api/account/notification-preferences
 * Returns the current user's email notification preferences.
 */
export const getNotificationPreferences = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).lean();
  if (!user) {
    throw new ApiError(404, "User not found.");
  }

  const emailPreferences = {
    jobAlerts: user.emailPreferences?.jobAlerts ?? true,
    applicantDigest: user.emailPreferences?.applicantDigest ?? true,
    profileNudges: user.emailPreferences?.profileNudges ?? true,
  };

  res.status(200).json(
    new ApiResponse(200, emailPreferences, "Notification preferences retrieved successfully.")
  );
});

/**
 * PATCH /api/account/notification-preferences
 * Updates the current user's email notification preferences.
 */
export const updateNotificationPreferences = asyncHandler(async (req, res) => {
  const { jobAlerts, applicantDigest, profileNudges } = req.body;

  const updateFields = {};
  if (typeof jobAlerts === "boolean") updateFields["emailPreferences.jobAlerts"] = jobAlerts;
  if (typeof applicantDigest === "boolean") updateFields["emailPreferences.applicantDigest"] = applicantDigest;
  if (typeof profileNudges === "boolean") updateFields["emailPreferences.profileNudges"] = profileNudges;

  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    { $set: updateFields },
    { new: true }
  ).lean();

  if (!updatedUser) {
    throw new ApiError(404, "User not found.");
  }

  await delCache(`user:${req.user._id}`);

  const emailPreferences = {
    jobAlerts: updatedUser.emailPreferences?.jobAlerts ?? true,
    applicantDigest: updatedUser.emailPreferences?.applicantDigest ?? true,
    profileNudges: updatedUser.emailPreferences?.profileNudges ?? true,
  };

  res.status(200).json(
    new ApiResponse(200, emailPreferences, "Notification preferences updated successfully.")
  );
});
