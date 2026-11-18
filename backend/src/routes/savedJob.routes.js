import { Router } from "express";
import rateLimit from "express-rate-limit";
import { getRateLimitStore } from "../config/redis.js";
import { protect, authorizeRoles } from "../middlewares/auth.middleware.js";
import {
  saveJob,
  unsaveJob,
  getSavedJobs,
  getSavedJobIds,
} from "../controllers/savedJob.controller.js";

const router = Router();

const savedJobLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  store: getRateLimitStore("rl:saved-jobs:"),
  message: {
    success: false,
    message: "Too many saved jobs requests. Please slow down.",
  },
});

// All routes require candidate authentication
router.use(protect, authorizeRoles("candidate"), savedJobLimiter);

// ── GET /api/saved-jobs/ids (must precede /:jobId) ───────────────────────────
router.get("/ids", getSavedJobIds);

// ── GET /api/saved-jobs (paginated) ──────────────────────────────────────────
router.get("/", getSavedJobs);

// ── POST /api/saved-jobs/:jobId ──────────────────────────────────────────────
router.post("/:jobId", saveJob);

// ── DELETE /api/saved-jobs/:jobId ────────────────────────────────────────────
router.delete("/:jobId", unsaveJob);

export default router;
