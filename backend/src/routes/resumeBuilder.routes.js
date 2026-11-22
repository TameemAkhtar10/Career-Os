import { Router } from "express";
import rateLimit from "express-rate-limit";
import { getRateLimitStore } from "../config/redis.js";
import { protect, authorizeRoles } from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import { resumeDraftSchema } from "../validators/resumeBuilder.schemas.js";
import {
  getResumeDraft,
  saveResumeDraft,
  downloadResumePdf,
  useAsProfileResume,
  deleteResumeDraft,
  checkResumeDraftQuality,
} from "../controllers/resumeBuilder.controller.js";

const router = Router();

/**
 * General limiter: GET draft, PUT autosave, DELETE draft.
 * 200 req / 15 min — plenty of headroom for normal editing sessions.
 */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  store: getRateLimitStore("rl:resume-builder-general:"),
  message: {
    success: false,
    message: "Too many resume builder requests. Please wait a moment.",
  },
});

/**
 * Quality-check limiter: POST /check
 * Deterministic scoring (no AI). Called automatically every 2 s while editing.
 * 120 req / 15 min ≈ one check every 7–8 s sustained, with burst headroom.
 */
const checkLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  store: getRateLimitStore("rl:resume-builder-check:"),
  message: {
    success: false,
    message: "Quality check rate limit reached. Please wait a moment before checking again.",
  },
});

/**
 * PDF / use-as-resume limiter: expensive operations.
 * 20 req / 15 min — user can download or save to profile many times per session.
 */
const pdfLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  store: getRateLimitStore("rl:resume-builder-pdf:"),
  message: {
    success: false,
    message: "Too many PDF or save requests. Please wait a moment before trying again.",
  },
});

router.use(protect);
router.use(authorizeRoles("candidate"));

// ── GET /api/resume-builder ───────────────────────────────────────────────────
router.get("/", generalLimiter, getResumeDraft);

// ── PUT /api/resume-builder ───────────────────────────────────────────────────
router.put("/", generalLimiter, validate(resumeDraftSchema), saveResumeDraft);

// ── POST /api/resume-builder/pdf ──────────────────────────────────────────────
router.post("/pdf", pdfLimiter, downloadResumePdf);

// ── POST /api/resume-builder/use-as-resume ────────────────────────────────────
router.post("/use-as-resume", pdfLimiter, useAsProfileResume);

// ── DELETE /api/resume-builder ────────────────────────────────────────────────
router.delete("/", generalLimiter, deleteResumeDraft);

// ── POST /api/resume-builder/check ────────────────────────────────────────────
router.post("/check", checkLimiter, checkResumeDraftQuality);

export default router;
