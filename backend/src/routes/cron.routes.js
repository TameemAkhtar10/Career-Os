import { Router } from "express";
import crypto from "crypto";
import rateLimit from "express-rate-limit";
import { env } from "../config/env.js";
import { getRateLimitStore } from "../config/redis.js";
import { getJobRunner } from "../jobs/index.js";

const router = Router();

const cronRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  store: getRateLimitStore("rl:cron:external:"),
  message: {
    success: false,
    message: "Too many cron trigger requests. Please slow down.",
  },
});

/**
 * Constant-time comparison using SHA256 digest hashes.
 * Guarantees equal-length buffer comparison to prevent timing attacks.
 */
const constantTimeEquals = (a, b) => {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const hashA = crypto.createHash("sha256").update(a).digest();
  const hashB = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(hashA, hashB);
};

/**
 * POST /api/cron/:task
 * External webhook endpoint for hosted schedulers (e.g. cron-job.org, GitHub Actions, Render).
 */
router.post("/:task", cronRateLimiter, (req, res) => {
  if (!env.CRON_SECRET) {
    return res.status(503).json({
      success: false,
      message: "Cron secret is not configured on this server.",
    });
  }

  const incomingSecret = req.headers["x-cron-secret"];
  if (!incomingSecret || !constantTimeEquals(incomingSecret, env.CRON_SECRET)) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized: Invalid cron secret.",
    });
  }

  const { task } = req.params;
  const runner = getJobRunner(task);

  if (!runner) {
    return res.status(400).json({
      success: false,
      message: `Unknown task '${task}'. Supported tasks: job-digest, recruiter-digest, job-auto-close, profile-nudge.`,
    });
  }

  // Acknowledge immediately with 202 Accepted
  res.status(202).json({
    success: true,
    message: `Task '${task}' accepted and started in background.`,
  });

  // Execute in the background (atomic lock prevents double-runs)
  runner({ dryRun: false, force: false }).catch((err) => {
    console.error(`[cron:external] Background task '${task}' error:`, err.message);
  });
});

export default router;

