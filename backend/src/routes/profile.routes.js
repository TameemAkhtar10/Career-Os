import { Router } from "express";
import validate from "../middlewares/validate.middleware.js";
import { protect, authorizeRoles } from "../middlewares/auth.middleware.js";
import cacheResponse from "../middlewares/cache.middleware.js";
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
} from "../controllers/profile.controller.js";

const router = Router();

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
