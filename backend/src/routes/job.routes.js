import { Router } from "express";
import validate from "../middlewares/validate.middleware.js";
import { protect, authorizeRoles, optionalAuth } from "../middlewares/auth.middleware.js";
import cacheResponse from "../middlewares/cache.middleware.js";
import rateLimit from "express-rate-limit";
import {
  createJobSchema,
  updateJobSchema,
  updateJobStatusSchema,
} from "../validators/job.schemas.js";
import { applyJobSchema } from "../validators/application.schemas.js";
import {
  createJob,
  getMyJobs,
  getPublicJobs,
  getJobById,
  updateJob,
  updateJobStatus,
  deleteJob,
} from "../controllers/job.controller.js";
import {
  applyToJob,
  getJobApplications,
} from "../controllers/application.controller.js";

const router = Router();

// Rate limiter for applying to jobs: 20 applications / 15 minutes
const applyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many applications submitted. Please try again later." },
});

// ── GET /api/jobs/mine (recruiter only, must be before /:id) ─────────────────
router.get("/mine", protect, authorizeRoles("recruiter"), getMyJobs);

// ── GET /api/jobs (public, cached 60s) ────────────────────────────────────────
router.get(
  "/",
  cacheResponse({
    ttl: 60,
    keyBuilder: (req) => `cache:jobs:list:${req.originalUrl}`,
  }),
  getPublicJobs
);

// ── GET /api/jobs/:jobId/applications (recruiter owner or admin) ─────────────
router.get(
  "/:jobId/applications",
  protect,
  authorizeRoles("recruiter", "admin"),
  getJobApplications
);

// ── POST /api/jobs/:jobId/apply (candidate only, rate-limited) ───────────────
router.post(
  "/:jobId/apply",
  applyLimiter,
  protect,
  authorizeRoles("candidate"),
  validate(applyJobSchema),
  applyToJob
);

// ── GET /api/jobs/:id (public, optional auth, cached 60s) ─────────────────────
router.get(
  "/:id",
  optionalAuth,
  cacheResponse({
    ttl: 60,
    keyBuilder: (req) => `cache:jobs:detail:${req.originalUrl}:${req.user?._id || "public"}`,
  }),
  getJobById
);

// ── POST /api/jobs (recruiter only) ──────────────────────────────────────────
router.post(
  "/",
  protect,
  authorizeRoles("recruiter"),
  validate(createJobSchema),
  createJob
);

// ── PATCH /api/jobs/:id (owner recruiter only) ───────────────────────────────
router.patch(
  "/:id",
  protect,
  authorizeRoles("recruiter"),
  validate(updateJobSchema),
  updateJob
);

// ── PATCH /api/jobs/:id/status (owner recruiter only) ─────────────────────────
router.patch(
  "/:id/status",
  protect,
  authorizeRoles("recruiter"),
  validate(updateJobStatusSchema),
  updateJobStatus
);

// ── DELETE /api/jobs/:id (owner recruiter or admin) ──────────────────────────
router.delete(
  "/:id",
  protect,
  authorizeRoles("recruiter", "admin"),
  deleteJob
);

export default router;
