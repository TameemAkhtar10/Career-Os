import mongoose from "mongoose";
import { Job } from "../models/job.model.js";
import { RecruiterProfile } from "../models/recruiterProfile.model.js";
import { CandidateProfile } from "../models/candidateProfile.model.js";
import { ResumeAnalysis } from "../models/ResumeAnalysis.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { delByPrefix, getCache, setCache } from "../utils/cache.js";
import { buildPublicJobsFilter, escapeRegex } from "../utils/jobFilter.js";
import { computeJobMatch } from "../utils/jobMatch.js";

export { escapeRegex };

/**
 * Redacts confidential salary information when isVisible is false.
 */
const sanitizeSalary = (job) => {
  if (job?.salary && job.salary.isVisible === false) {
    return {
      ...job,
      salary: { isVisible: false },
    };
  }
  return job;
};

/**
 * POST /api/jobs (recruiter only)
 * Creates a new job. Must already have a company profile.
 */
export const createJob = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Recruiter must have a completed company profile
  const recruiterProfile = await RecruiterProfile.findOne({ user: userId });
  if (!recruiterProfile || !recruiterProfile.companyName) {
    throw new ApiError(400, "Complete your company profile first.");
  }

  // Compute fresher-friendly flag and snapshot company name
  const isFresherFriendly = req.body.experience?.minYears === 0;

  const job = await Job.create({
    ...req.body,
    recruiter: userId,
    companyName: recruiterProfile.companyName,
    isFresherFriendly,
  });

  // Invalidate all public job cache keys
  await delByPrefix("cache:jobs:");

  res.status(201).json(new ApiResponse(201, job, "Job posted successfully."));
});

/**
 * GET /api/jobs/mine (recruiter only)
 * Returns the recruiter's own jobs with optional status filter and pagination.
 */
export const getMyJobs = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { status } = req.query;

  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
  const skip = (page - 1) * limit;

  const filter = { recruiter: userId };
  if (status && ["draft", "open", "closed"].includes(status)) {
    filter.status = status;
  }

  const [jobs, total] = await Promise.all([
    Job.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Job.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(total / limit) || 1;

  res.status(200).json(
    new ApiResponse(
      200,
      { jobs, page, limit, total, totalPages },
      "My jobs fetched successfully."
    )
  );
});

/**
 * GET /api/jobs (public)
 * Returns active open jobs whose application deadline has not passed.
 * Query params: q, city, workMode, jobType, skills, fresher, minSalary, sort, page, limit.
 */
export const getPublicJobs = asyncHandler(async (req, res) => {
  const {
    q,
    city,
    workMode,
    jobType,
    skills,
    fresher,
    minSalary,
    sort = "latest",
  } = req.query;

  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
  const skip = (page - 1) * limit;

  // Build filter using shared query logic (exact match with job alerts cron)
  const filter = buildPublicJobsFilter({
    q,
    city,
    workMode,
    jobType,
    skills,
    fresher,
    minSalary,
  });

  // Sort options
  const sortOptions =
    sort === "salary"
      ? { "salary.max": -1, "salary.min": -1, createdAt: -1 }
      : { createdAt: -1 };

  const [rawJobs, total] = await Promise.all([
    Job.find(filter).sort(sortOptions).skip(skip).limit(limit).lean(),
    Job.countDocuments(filter),
  ]);

  const recruiterIds = rawJobs
    .map((j) => j.recruiter?._id || j.recruiter)
    .filter(Boolean);

  const recruiterProfiles = recruiterIds.length
    ? await RecruiterProfile.find({ user: { $in: recruiterIds } })
        .select("user isVerified")
        .lean()
    : [];

  const verifiedMap = new Map(
    recruiterProfiles.map((p) => [String(p.user), Boolean(p.isVerified)])
  );

  // Hide salary when isVisible is false and ensure no recruiter contact details are exposed
  const jobs = rawJobs.map((job) => {
    const sanitized = sanitizeSalary(job);
    const recId = String(sanitized.recruiter?._id || sanitized.recruiter || "");
    sanitized.isCompanyVerified = verifiedMap.get(recId) || false;

    if (sanitized.recruiter && typeof sanitized.recruiter === "object") {
      sanitized.recruiter = {
        _id: sanitized.recruiter._id,
        name: sanitized.recruiter.name,
      };
    }
    return sanitized;
  });
  const totalPages = Math.ceil(total / limit) || 1;

  res.status(200).json(
    new ApiResponse(
      200,
      { jobs, page, limit, total, totalPages },
      "Jobs fetched successfully."
    )
  );
});

/**
 * GET /api/jobs/:id (public)
 * Job detail. Returns 404 if not open unless the viewer is the owner recruiter or admin.
 */
export const getJobById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid job ID.");
  }

  const job = await Job.findById(id).populate("recruiter", "name email").lean();
  if (!job) {
    throw new ApiError(404, "Job not found.");
  }

  const isOwner =
    req.user &&
    Boolean(job.recruiter) &&
    String(job.recruiter?._id || job.recruiter) === String(req.user._id);
  const isAdmin = req.user?.role === "admin";

  // 404 if not open unless viewer is owner or admin
  if (job.status !== "open" && !isOwner && !isAdmin) {
    throw new ApiError(404, "Job not found.");
  }

  let isCompanyVerified = false;
  if (job.recruiter) {
    const recId = job.recruiter?._id || job.recruiter;
    const recProfile = await RecruiterProfile.findOne({ user: recId })
      .select("isVerified")
      .lean();
    isCompanyVerified = Boolean(recProfile?.isVerified);
  }

  // Privacy protection: Public responses must NEVER include the recruiter's email or contact details.
  // The owner and admin may see full details (including email).
  if (!isOwner && !isAdmin) {
    if (job.recruiter && typeof job.recruiter === "object") {
      job.recruiter = {
        _id: job.recruiter._id,
        name: job.recruiter.name,
      };
    }
  }

  // Hide salary if not visible and viewer is not owner or admin
  const sanitizedJob =
    !isOwner && !isAdmin ? sanitizeSalary(job) : job;
  sanitizedJob.isCompanyVerified = isCompanyVerified;

  res.status(200).json(new ApiResponse(200, sanitizedJob, "Job details fetched successfully."));
});

/**
 * PATCH /api/jobs/:id (owner recruiter only)
 * Updates job fields.
 */
export const updateJob = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid job ID.");
  }

  const job = await Job.findById(id);
  if (!job) {
    throw new ApiError(404, "Job not found.");
  }

  // Only the owner recruiter can update
  if (String(job.recruiter) !== String(req.user._id)) {
    throw new ApiError(403, "You do not have permission to edit this job.");
  }

  // Prevent modifying immutable fields
  const updatePayload = { ...req.body };
  delete updatePayload.recruiter;
  delete updatePayload.companyName;
  delete updatePayload.createdAt;

  if (
    updatePayload.experience &&
    typeof updatePayload.experience.minYears === "number"
  ) {
    updatePayload.isFresherFriendly = updatePayload.experience.minYears === 0;
  }

  const updatedJob = await Job.findByIdAndUpdate(id, updatePayload, {
    returnDocument: "after",
    runValidators: true,
  });

  // Invalidate all job and application caches
  await delByPrefix("cache:jobs:");
  await delByPrefix("cache:applications:");

  res.status(200).json(new ApiResponse(200, updatedJob, "Job updated successfully."));
});

/**
 * PATCH /api/jobs/:id/status (owner recruiter only)
 * Changes job status between draft, open, closed.
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

  if (String(job.recruiter) !== String(req.user._id)) {
    throw new ApiError(403, "You do not have permission to update this job's status.");
  }

  job.status = status;
  await job.save();

  // Invalidate all job and application caches
  await delByPrefix("cache:jobs:");
  await delByPrefix("cache:applications:");

  res.status(200).json(new ApiResponse(200, job, "Job status updated successfully."));
});

/**
 * DELETE /api/jobs/:id (owner recruiter or admin)
 * Soft-closes job by setting status to 'closed'. Never hard-deletes.
 */
export const deleteJob = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid job ID.");
  }

  const job = await Job.findById(id);
  if (!job) {
    throw new ApiError(404, "Job not found.");
  }

  const isOwner = String(job.recruiter) === String(req.user._id);
  const isAdmin = req.user?.role === "admin";

  if (!isOwner && !isAdmin) {
    throw new ApiError(403, "You do not have permission to close this job.");
  }

  job.status = "closed";
  await job.save();

  // Invalidate all job and application caches
  await delByPrefix("cache:jobs:");
  await delByPrefix("cache:applications:");

  res.status(200).json(new ApiResponse(200, null, "Job closed successfully."));
});

/**
 * Calculates total experience in years from profile experience array.
 */
export const calculateExperienceYears = (experienceList = []) => {
  if (!Array.isArray(experienceList) || experienceList.length === 0) return 0;
  let totalMonths = 0;
  const now = new Date();
  for (const exp of experienceList) {
    if (!exp.from) continue;
    const from = new Date(exp.from);
    const to = exp.to ? new Date(exp.to) : now;
    const months = (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());
    if (months > 0) totalMonths += months;
  }
  return Math.round((totalMonths / 12) * 10) / 10;
};

/**
 * Generates actionable tips derived honestly from missing skills and resume status.
 */
export const generateMatchTips = (missingSkills = [], hasResume = false, hasProfileSkills = false, matchScore = null) => {
  const tips = [];
  if (!hasProfileSkills) {
    tips.push("Add technical skills to your candidate profile to calculate an accurate match score.");
  }
  if (!hasResume) {
    tips.push("Upload your PDF resume to unlock resume evidence scoring and keyword verification.");
  }
  if (missingSkills.length > 0) {
    tips.push(`Add ${missingSkills[0]} to your profile if you have used or studied it.`);
    if (missingSkills.length > 1) {
      tips.push(`Strengthen your fit by adding ${missingSkills[1]} or building a project with it.`);
    }
  } else if (matchScore != null && matchScore >= 80) {
    tips.push("Your listed skills match all required job requirements strongly!");
  }
  return tips.slice(0, 3);
};

/**
 * GET /api/jobs/:id/match (candidate only, cached 60s)
 * Computes deterministic job match and skill gap analysis for the logged-in candidate.
 */
export const getJobMatch = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid job ID.");
  }

  const cacheKey = `cache:job:match:${userId}:${id}`;
  const cached = await getCache(cacheKey);
  if (cached) {
    return res.status(200).json(new ApiResponse(200, cached, "Job match fetched from cache."));
  }

  const now = new Date();
  const job = await Job.findById(id).lean();
  if (!job) {
    throw new ApiError(404, "Job not found.");
  }

  const isDeadlinePassed = Boolean(
    job.applicationDeadline && new Date(job.applicationDeadline).getTime() < now.getTime()
  );
  if (job.status !== "open" || isDeadlinePassed) {
    throw new ApiError(404, "This job is not currently open.");
  }

  // Load candidate profile & latest resume analysis in parallel
  const [profile, latestAnalysis] = await Promise.all([
    CandidateProfile.findOne({ user: userId }).lean(),
    ResumeAnalysis.findOne({ user: userId })
      .select("keywords score createdAt")
      .sort({ createdAt: -1 })
      .lean(),
  ]);

  const candidateSkills = profile?.skills || [];
  const resumeSkills = latestAnalysis?.keywords?.present || [];
  const candidateExperienceYears = profile?.experience ? calculateExperienceYears(profile.experience) : null;
  const hasResume = Boolean(profile?.resume?.fileId);
  const hasProfileSkills = candidateSkills.length > 0;

  const matchResult = computeJobMatch({
    candidateSkills,
    resumeSkills,
    jobSkills: job.skills || [],
    jobDescription: job.description || "",
    candidateExperienceYears,
    job,
  });

  const tips = generateMatchTips(
    matchResult.missingSkills,
    hasResume,
    hasProfileSkills,
    matchResult.matchScore
  );

  const payload = {
    matchScore: matchResult.matchScore,
    matchedSkills: matchResult.matchedSkills,
    missingSkills: matchResult.missingSkills,
    hasResume,
    hasProfileSkills,
    tips,
  };

  // Cache for 60 seconds
  await setCache(cacheKey, payload, 60);

  res.status(200).json(new ApiResponse(200, payload, "Job match calculated successfully."));
});
