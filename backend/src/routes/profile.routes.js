import { Router } from "express";
import rateLimit from "express-rate-limit";
import { getRateLimitStore } from "../config/redis.js";
import validate from "../middlewares/validate.middleware.js";
import { protect, authorizeRoles } from "../middlewares/auth.middleware.js";
import cacheResponse from "../middlewares/cache.middleware.js";
import { handleResumeUpload, handleLogoUpload } from "../middlewares/upload.middleware.js";
import {
  candidateProfileSchema,
  recruiterProfileSchema,
} from "../validators/profile.schemas.js";
import {
  getProfileMe,
  upsertCandidateProfile,
  upsertRecruiterProfile,
  getCandidateProfileById,
  profileMeCacheKey,
  uploadCandidateResume,
  deleteCandidateResume,
  getCandidateResumeSignedUrl,
  getCandidateResumeUrl,
  streamCandidateResumeFile,
  uploadRecruiterLogo,
} from "../controllers/profile.controller.js";

const router = Router();

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  store: getRateLimitStore("rl:profile:upload:"),
  message: { success: false, message: "Too many upload attempts. Please try again later." },
});

// ── GET /api/profile/me (protected, cached per user) ──────────────────────────
router.get(
  "/me",
  protect,
  cacheResponse({
    ttl: 5 * 60, // 5 minutes
    keyBuilder: (req) => profileMeCacheKey(req.user?._id),
  }),
  getProfileMe
);

// ── POST /api/profile/candidate/resume (candidate only) ───────────────────────
router.post(
  "/candidate/resume",
  protect,
  authorizeRoles("candidate"),
  uploadLimiter,
  handleResumeUpload,
  uploadCandidateResume
);

// ── DELETE /api/profile/candidate/resume (candidate only) ─────────────────────
router.delete(
  "/candidate/resume",
  protect,
  authorizeRoles("candidate"),
  deleteCandidateResume
);

// ── GET /api/profile/candidate/resume (candidate only) ────────────────────────
router.get(
  "/candidate/resume",
  protect,
  authorizeRoles("candidate"),
  getCandidateResumeSignedUrl
);

// ── GET /api/profile/candidate/resume/file (candidate only, streaming) ────────
router.get(
  "/candidate/resume/file",
  protect,
  authorizeRoles("candidate"),
  streamCandidateResumeFile
);

// ── POST /api/profile/recruiter/logo (recruiter only) ─────────────────────────
router.post(
  "/recruiter/logo",
  protect,
  authorizeRoles("recruiter"),
  uploadLimiter,
  handleLogoUpload,
  uploadRecruiterLogo
);

// ── PUT /api/profile/candidate (candidate only) ───────────────────────────────
router.put(
  "/candidate",
  protect,
  authorizeRoles("candidate"),
  validate(candidateProfileSchema),
  upsertCandidateProfile
);

// ── PUT /api/profile/recruiter (recruiter only) ───────────────────────────────
router.put(
  "/recruiter",
  protect,
  authorizeRoles("recruiter"),
  validate(recruiterProfileSchema),
  upsertRecruiterProfile
);

// ── GET /api/profile/candidate/:userId (recruiter or admin only) ─────────────
router.get(
  "/candidate/:userId",
  protect,
  authorizeRoles("recruiter", "admin"),
  getCandidateProfileById
);

export default router;
