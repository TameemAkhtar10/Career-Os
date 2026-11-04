import mongoose from "mongoose";
import { Job } from "../models/job.model.js";
import { RecruiterProfile } from "../models/recruiterProfile.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { delByPrefix } from "../utils/cache.js";

/**
 * Escapes regex special characters in a user-provided string.
 */
export const escapeRegex = (str = "") => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

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

  const now = new Date();

  // Base filter: open status and non-expired deadline
  const filter = {
    status: "open",
    $and: [
      {
        $or: [
          { applicationDeadline: null },
          { applicationDeadline: { $gte: now } },
        ],
      },
    ],
  };

  // Text / keyword search across title, skills, companyName, description
  if (q && typeof q === "string" && q.trim().length > 0) {
    const safeQ = escapeRegex(q.trim());
    filter.$and.push({
      $or: [
        { title: { $regex: safeQ, $options: "i" } },
        { companyName: { $regex: safeQ, $options: "i" } },
        { skills: { $in: [new RegExp(safeQ, "i")] } },
        { description: { $regex: safeQ, $options: "i" } },
      ],
    });
  }

  // Location city filter
  if (city && typeof city === "string" && city.trim().length > 0) {
    filter["location.city"] = { $regex: escapeRegex(city.trim()), $options: "i" };
  }

  // Work mode
  if (["onsite", "remote", "hybrid"].includes(workMode)) {
    filter.workMode = workMode;
  }

  // Job type
  if (["full_time", "internship", "part_time", "contract"].includes(jobType)) {
    filter.jobType = jobType;
  }

  // Skills filter (comma-separated list)
  if (skills && typeof skills === "string") {
    const skillList = skills
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (skillList.length > 0) {
      filter.skills = {
        $in: skillList.map((s) => new RegExp(`^${escapeRegex(s)}$`, "i")),
      };
    }
  }

  // Fresher friendly
  if (fresher === "true" || fresher === true) {
    filter.isFresherFriendly = true;
  }

  // Min salary filter: salary.max >= minSalary (or salary.min >= minSalary)
  if (minSalary != null) {
    const salaryVal = Number(minSalary);
    if (!isNaN(salaryVal) && salaryVal > 0) {
      filter.$and.push({
        $or: [
          { "salary.max": { $gte: salaryVal } },
          {
            $and: [
              { "salary.max": null },
              { "salary.min": { $gte: salaryVal } },
            ],
          },
        ],
      });
    }
  }

  // Sort options
  const sortOptions =
    sort === "salary"
      ? { "salary.max": -1, "salary.min": -1, createdAt: -1 }
      : { createdAt: -1 };

  const [rawJobs, total] = await Promise.all([
    Job.find(filter).sort(sortOptions).skip(skip).limit(limit).lean(),
    Job.countDocuments(filter),
  ]);

  // Hide salary when isVisible is false and ensure no recruiter contact details are exposed
  const jobs = rawJobs.map((job) => {
    const sanitized = sanitizeSalary(job);
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

  // Invalidate all job caches
  await delByPrefix("cache:jobs:");

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

  // Invalidate all job caches
  await delByPrefix("cache:jobs:");

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

  // Invalidate all job caches
  await delByPrefix("cache:jobs:");

  res.status(200).json(new ApiResponse(200, null, "Job closed successfully."));
});
