import { Router } from "express";
import rateLimit from "express-rate-limit";
import { getRateLimitStore } from "../config/redis.js";
import { protect } from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import {
  deleteAccountSchema,
  updateNotificationPreferencesSchema,
} from "../validators/account.schemas.js";
import {
  deleteAccount,
  exportAccountData,
  getNotificationPreferences,
  updateNotificationPreferences,
} from "../controllers/account.controller.js";

const router = Router();

const exportLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  store: getRateLimitStore("rl:account:export:"),
  message: { success: false, message: "Too many export requests. Please try again later." },
});

const deleteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  store: getRateLimitStore("rl:account:delete:"),
  message: { success: false, message: "Too many deletion attempts. Please try again later." },
});

router.use(protect);

router.get("/export", exportLimiter, exportAccountData);
router.delete("/", deleteLimiter, validate(deleteAccountSchema), deleteAccount);

// ── Notification Preferences ──────────────────────────────────────────────────
router.get("/notification-preferences", getNotificationPreferences);
router.patch(
  "/notification-preferences",
  validate(updateNotificationPreferencesSchema),
  updateNotificationPreferences
);

export default router;
