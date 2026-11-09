import mongoose from "mongoose";
import { Application } from "../models/application.model.js";
import { Job } from "../models/job.model.js";
import { User } from "../models/user.model.js";
import { CandidateProfile } from "../models/candidateProfile.model.js";
import { calculateCandidateCompleteness } from "./profile.controller.js";
import {
  sendApplicationStatusEmail,
  sendApplicationConfirmationEmail,
  sendRecruiterNewApplicantEmail,
} from "../services/email.service.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { delByPrefix } from "../utils/cache.js";
import {
  openResumeDownloadStream,
  findResumeFile,
} from "../services/gridfs.service.js";

/**
 * POST /api/jobs/:jobId/apply (candidate only)
 * Applies to an open job. Computes match score and ensures unique application.
 */
export const applyToJob = asyncHandler(async (req, res) => {
  const { jobId } = req.params;
  const candidateId = req.user._id;

  if (!mongoose.Types.ObjectId.isValid(jobId)) {
    throw new ApiError(400, "Invalid job ID.");
  }

  // 1. Candidate must have completed profile
  const candidateProfile = await CandidateProfile.findOne({ user: candidateId });
  if (!candidateProfile) {
    throw new ApiError(400, "Complete your profile before applying.");
  }

  // 2. Job must exist, be open, and deadline not passed
  const job = await Job.findById(jobId);
  if (!job) {
    throw new ApiError(404, "Job not found.");
  }
  if (job.status !== "open") {
    throw new ApiError(400, "This job is not accepting applications.");
  }
  if (job.applicationDeadline && new Date() > job.applicationDeadline) {
    throw new ApiError(400, "The application deadline for this job has passed.");
  }

  // 3. Prevent duplicate application
  const existing = await Application.findOne({ job: jobId, candidate: candidateId });
  if (existing) {
    throw new ApiError(409, "You have already applied.");
  }

  // 4. Compute matchScore at apply time: percentage of job skills present in candidate skills (case-insensitive)
  let matchScore = 0;
  if (Array.isArray(job.skills) && job.skills.length > 0) {
    const candidateSkills = new Set(
      (candidateProfile.skills || []).map((s) => s.toLowerCase().trim())
    );
    const matchedCount = job.skills.filter((s) =>
      candidateSkills.has(s.toLowerCase().trim())
    ).length;
    matchScore = Math.min(
      100,
      Math.max(0, Math.round((matchedCount / job.skills.length) * 100))
    );
  }

  // 5. Create application document
  let application;
  try {
    application = await Application.create({
      job: jobId,
      candidate: candidateId,
      recruiter: job.recruiter,
      coverNote: req.body.coverNote || "",
      matchScore,
      status: "applied",
      statusHistory: [{ status: "applied", at: new Date() }],
    });
  } catch (err) {
    if (err.code === 11000) {
      throw new ApiError(409, "You have already applied.");
    }
    throw err;
  }

  // Invalidate applications cache
  await delByPrefix("cache:applications:");

  // Non-blocking notification emails
  if (req.user?.email) {
    sendApplicationConfirmationEmail(
      req.user.email,
      req.user.name || "Candidate",
      job.title,
      job.companyName
    ).catch((err) => {
      console.error(
        `[application.controller] Failed to send application confirmation to candidate ${req.user.email}:`,
        err.message
      );
    });
  }

  if (job.recruiter) {
    User.findById(job.recruiter)
      .select("name email")
      .lean()
      .then((recruiterUser) => {
        if (recruiterUser?.email) {
          return sendRecruiterNewApplicantEmail(
            recruiterUser.email,
            recruiterUser.name || "Recruiter",
            job.title,
            job.companyName,
            matchScore,
            job._id
          );
        }
      })
      .catch((err) => {
        console.error(
          `[application.controller] Failed to send new applicant email to recruiter for job ${job._id}:`,
          err.message
        );
      });
  }

  res.status(201).json(new ApiResponse(201, application, "Application submitted successfully."));
});

/**
 * GET /api/applications/mine (candidate only)
 * Returns own applications with job title, companyName, and status.
 */
export const getMyApplications = asyncHandler(async (req, res) => {
  const candidateId = req.user._id;
  const { status } = req.query;

  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
  const skip = (page - 1) * limit;

  const filter = { candidate: candidateId };
  if (status && ["applied", "shortlisted", "rejected", "hired", "withdrawn"].includes(status)) {
    filter.status = status;
  }

  const [applications, total] = await Promise.all([
    Application.find(filter)
      .populate("job", "title companyName location workMode jobType status")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Application.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(total / limit) || 1;

  res.status(200).json(
    new ApiResponse(
      200,
      { applications, page, limit, total, totalPages },
      "My applications fetched successfully."
    )
  );
});

/**
 * PATCH /api/applications/:id/withdraw (candidate owner only)
 * Allowed only while status is applied or shortlisted.
 */
export const withdrawApplication = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const candidateId = req.user._id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid application ID.");
  }

  const application = await Application.findById(id);
  if (!application) {
    throw new ApiError(404, "Application not found.");
  }

  if (String(application.candidate) !== String(candidateId)) {
    throw new ApiError(403, "You do not have permission to withdraw this application.");
  }

  if (!["applied", "shortlisted"].includes(application.status)) {
    throw new ApiError(400, "Applications can only be withdrawn while applied or shortlisted.");
  }

  application.status = "withdrawn";
  application.statusHistory.push({ status: "withdrawn", at: new Date() });
  await application.save();

  // Invalidate cache
  await delByPrefix("cache:applications:");

  res.status(200).json(new ApiResponse(200, application, "Application withdrawn successfully."));
});

/**
 * GET /api/jobs/:jobId/applications (recruiter owner or admin)
 * Applicants with candidate name, headline, skills, matchScore, profileCompleteness, status.
 * Never returns candidate phone or email.
 */
export const getJobApplications = asyncHandler(async (req, res) => {
  const { jobId } = req.params;
  const { status, minScore } = req.query;

  if (!mongoose.Types.ObjectId.isValid(jobId)) {
    throw new ApiError(400, "Invalid job ID.");
  }

  const job = await Job.findById(jobId);
  if (!job) {
    throw new ApiError(404, "Job not found.");
  }

  // Recruiter can never touch applications for another recruiter's job
  if (req.user.role === "recruiter" && String(job.recruiter) !== String(req.user._id)) {
    throw new ApiError(403, "You do not have permission to view applications for this job.");
  }

  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
  const skip = (page - 1) * limit;

  const filter = { job: jobId };
  if (status && ["applied", "shortlisted", "rejected", "hired", "withdrawn"].includes(status)) {
    filter.status = status;
  }
  if (minScore != null) {
    const scoreVal = Number(minScore);
    if (!isNaN(scoreVal) && scoreVal >= 0) {
      filter.matchScore = { $gte: scoreVal };
    }
  }

  // Sort by matchScore desc by default
  const isAdmin = req.user.role === "admin";
  const sort = { matchScore: -1, createdAt: -1 };

  const [rawApplications, total] = await Promise.all([
    Application.find(filter)
      .populate("candidate", isAdmin ? "name email" : "name") // Recruiters NEVER get email or phone
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Application.countDocuments(filter),
  ]);

  // Fetch candidate profiles to extract headline, skills, and profileCompleteness
  const candidateIds = rawApplications
    .map((app) => app.candidate?._id || app.candidate)
    .filter(Boolean);

  const profiles = await CandidateProfile.find({ user: { $in: candidateIds } }).lean();
  const profileMap = new Map(profiles.map((p) => [String(p.user), p]));

  // Sanitize applicants: return name, headline, skills, matchScore, profileCompleteness, status
  const applications = rawApplications.map((app) => {
    const candId = String(app.candidate?._id || app.candidate);
    const candProfile = profileMap.get(candId);
    const profileCompleteness = candProfile
      ? calculateCandidateCompleteness(candProfile)
      : 0;

    const candidateData = {
      _id: app.candidate?._id || app.candidate,
      name: app.candidate?.name || "",
      headline: candProfile?.headline || "",
      skills: candProfile?.skills || [],
      profileCompleteness,
    };

    // Only admin may see candidate email and phone
    if (isAdmin) {
      if (app.candidate?.email) candidateData.email = app.candidate.email;
      if (candProfile?.phone) candidateData.phone = candProfile.phone;
    }

    return {
      _id: app._id,
      job: app.job,
      status: app.status,
      coverNote: app.coverNote,
      matchScore: app.matchScore,
      hasResume: Boolean(candProfile?.resume?.fileId),
      recruiterNote: app.recruiterNote,
      statusHistory: app.statusHistory,
      createdAt: app.createdAt,
      updatedAt: app.updatedAt,
      candidate: candidateData,
    };
  });

  const totalPages = Math.ceil(total / limit) || 1;

  res.status(200).json(
    new ApiResponse(
      200,
      { applications, page, limit, total, totalPages },
      "Job applications fetched successfully."
    )
  );
});

/**
 * PATCH /api/applications/:id/status (recruiter owner only)
 * Set shortlisted | rejected | hired, optional recruiterNote.
 * Non-blocking email sent to candidate.
 */
export const updateApplicationStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, recruiterNote } = req.body;
  const recruiterId = req.user._id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid application ID.");
  }

  const application = await Application.findById(id)
    .populate("job", "title companyName recruiter")
    .populate("candidate", "name email");

  if (!application) {
    throw new ApiError(404, "Application not found.");
  }

  // Recruiter can never touch applications for another recruiter's job
  if (String(application.recruiter) !== String(recruiterId)) {
    throw new ApiError(403, "You do not have permission to update this application.");
  }

  // Block changes on withdrawn applications
  if (application.status === "withdrawn") {
    throw new ApiError(400, "Cannot change status of a withdrawn application.");
  }

  application.status = status;
  if (recruiterNote !== undefined) {
    application.recruiterNote = recruiterNote;
  }
  application.statusHistory.push({ status, at: new Date() });
  await application.save();

  // Invalidate cache
  await delByPrefix("cache:applications:");

  // Send status update email asynchronously without blocking response
  if (application.candidate?.email) {
    sendApplicationStatusEmail(
      application.candidate.email,
      application.candidate.name || "Candidate",
      application.job?.title || "Role",
      application.job?.companyName || "Company",
      status
    ).catch((err) => {
      console.error(
        `[application.controller] Failed to send status email to ${application.candidate.email}:`,
        err.message
      );
    });
  }

  res.status(200).json(
    new ApiResponse(200, application, "Application status updated successfully.")
  );
});

/**
 * GET /api/applications/:id/resume (recruiter owner or admin)
 * Returns relative streaming URL for an applicant's resume with both 'url' and 'resumeUrl'.
 * A recruiter can ONLY access resumes of candidates who applied to their own jobs (403 otherwise).
 * Legacy non-GridFS records return 404 "Resume needs to be re-uploaded".
 */
export const getApplicationResumeUrl = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const viewer = req.user;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid application ID.");
  }

  const application = await Application.findById(id).populate("job", "recruiter title");
  if (!application) {
    throw new ApiError(404, "Application not found.");
  }

  const isOwner =
    application.job &&
    String(application.job.recruiter) === String(viewer._id);
  const isAdmin = viewer.role === "admin";

  if (!isOwner && !isAdmin) {
    throw new ApiError(403, "You do not have permission to access this candidate's resume.");
  }

  const candidateProfile = await CandidateProfile.findOne({
    user: application.candidate,
  });

  if (!candidateProfile || !candidateProfile.resume || !candidateProfile.resume.fileId) {
    throw new ApiError(404, "No resume uploaded for this candidate.");
  }

  if (candidateProfile.resume.storage !== "gridfs") {
    throw new ApiError(404, "Resume needs to be re-uploaded");
  }

  const relativeUrl = `/api/applications/${id}/resume/file`;

  res.status(200).json(
    new ApiResponse(
      200,
      {
        url: relativeUrl,
        resumeUrl: relativeUrl,
        fileName: candidateProfile.resume.fileName,
      },
      "Candidate resume URL generated successfully."
    )
  );
});

/**
 * GET /api/applications/:id/resume/file (recruiter owner or admin)
 * Streams an applicant's PDF resume directly from MongoDB GridFS.
 * A recruiter can ONLY access resumes of candidates who applied to their own jobs (403 otherwise).
 */
export const streamApplicationResumeFile = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const viewer = req.user;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid application ID.");
  }

  const application = await Application.findById(id).populate("job", "recruiter title");
  if (!application) {
    throw new ApiError(404, "Application not found.");
  }

  const isOwner =
    application.job &&
    String(application.job.recruiter) === String(viewer._id);
  const isAdmin = viewer.role === "admin";

  if (!isOwner && !isAdmin) {
    throw new ApiError(403, "You do not have permission to access this candidate's resume.");
  }

  const candidateProfile = await CandidateProfile.findOne({
    user: application.candidate,
  });

  if (!candidateProfile || !candidateProfile.resume || !candidateProfile.resume.fileId) {
    throw new ApiError(404, "No resume uploaded for this candidate.");
  }

  if (candidateProfile.resume.storage !== "gridfs") {
    throw new ApiError(404, "Resume needs to be re-uploaded");
  }

  const fileDoc = await findResumeFile(candidateProfile.resume.fileId);
  if (!fileDoc) {
    throw new ApiError(404, "Resume file not found in storage.");
  }

  const safeFileName = (candidateProfile.resume.fileName || fileDoc.filename || "resume.pdf").replace(/["\r\n\\]/g, "");

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename="${safeFileName}"`);
  res.setHeader("Cache-Control", "private, no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  if (fileDoc.length) {
    res.setHeader("Content-Length", fileDoc.length);
  }

  const downloadStream = openResumeDownloadStream(candidateProfile.resume.fileId);
  downloadStream.on("error", (err) => {
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: "Failed to stream resume." });
    }
  });

  downloadStream.pipe(res);
});
