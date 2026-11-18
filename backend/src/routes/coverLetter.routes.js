import { Router } from "express";
import rateLimit from "express-rate-limit";
import { getRateLimitStore } from "../config/redis.js";
import { protect, authorizeRoles } from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import { generateCoverLetterSchema } from "../validators/coverLetter.schemas.js";
import { generateCoverLetter } from "../controllers/coverLetter.controller.js";

const router = Router();

// Rate limiter for cover letter generation: 15 calls / 15 minutes
const coverLetterLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  store: getRateLimitStore("rl:cover-letter:generate:"),
  message: {
    success: false,
    message: "Too many cover letter requests. Please wait a few minutes before trying again.",
  },
});

// ── POST /api/cover-letter/generate (candidate only) ──────────────────────────
router.post(
  "/generate",
  protect,
  authorizeRoles("candidate"),
  coverLetterLimiter,
  validate(generateCoverLetterSchema),
  generateCoverLetter
);

export default router;
