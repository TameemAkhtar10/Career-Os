import { Router } from "express";
import rateLimit from "express-rate-limit";
import { getRateLimitStore } from "../config/redis.js";
import { protect, authorizeRoles } from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import {
  createJobAlertSchema,
  updateJobAlertSchema,
} from "../validators/jobAlert.schemas.js";
import {
  createJobAlert,
  getMyJobAlerts,
  updateJobAlert,
  deleteJobAlert,
  pauseAlertWithToken,
} from "../controllers/jobAlert.controller.js";

const router = Router();

const alertLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  store: getRateLimitStore("rl:job-alerts:"),
  message: {
    success: false,
    message: "Too many alert requests. Please slow down.",
  },
});

// ── One-click pause without login (signed JWT token) ─────────────────────────
router.post("/pause", alertLimiter, pauseAlertWithToken);
router.get("/pause", alertLimiter, pauseAlertWithToken);

// ── Authenticated Candidate Routes ───────────────────────────────────────────
router.use(protect, authorizeRoles("candidate"), alertLimiter);

router.post("/", validate(createJobAlertSchema), createJobAlert);
router.get("/", getMyJobAlerts);
router.patch("/:id", validate(updateJobAlertSchema), updateJobAlert);
router.delete("/:id", deleteJobAlert);

export default router;
