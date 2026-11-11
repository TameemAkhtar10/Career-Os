import { Router } from "express";
import rateLimit from "express-rate-limit";
import { getRateLimitStore } from "../config/redis.js";
import { protect, authorizeRoles } from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import { analyzeResumeSchema } from "../validators/resume.schemas.js";
import {
  analyzeResume,
  getMyResumeAnalyses,
  getResumeAnalysisById,
  deleteResumeAnalysisById,
  deleteAllMyResumeAnalyses,
  withdrawAiConsent,
  streamResumeFile,
} from "../controllers/resume.controller.js";

const router = Router();

const analyzeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  store: getRateLimitStore("rl:resume:analyze:"),
  message: {
    success: false,
    message: "Too many resume analysis requests. Please wait a few minutes before trying again.",
  },
});

// All routes require candidate authentication
router.use(protect);
router.use(authorizeRoles("candidate"));

// ── POST /api/resume/analyze ──────────────────────────────────────────────────
router.post("/analyze", analyzeLimiter, validate(analyzeResumeSchema), analyzeResume);

// ── GET /api/resume/analyses (paginated history) ──────────────────────────────
router.get("/analyses", getMyResumeAnalyses);

// ── DELETE /api/resume/analyses (bulk delete all own analyses) ────────────────
router.delete("/analyses", analyzeLimiter, deleteAllMyResumeAnalyses);

// ── GET /api/resume/analyses/:id ──────────────────────────────────────────────
router.get("/analyses/:id", getResumeAnalysisById);

// ── DELETE /api/resume/analyses/:id ───────────────────────────────────────────
router.delete("/analyses/:id", deleteResumeAnalysisById);

// ── DELETE /api/resume/consent ────────────────────────────────────────────────
router.delete("/consent", withdrawAiConsent);

// ── GET /api/resume/file (inline preview stream) ──────────────────────────────
router.get("/file", streamResumeFile);

export default router;
