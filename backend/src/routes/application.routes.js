import { Router } from "express";
import validate from "../middlewares/validate.middleware.js";
import { protect, authorizeRoles } from "../middlewares/auth.middleware.js";
import cacheResponse from "../middlewares/cache.middleware.js";
import { updateApplicationStatusSchema } from "../validators/application.schemas.js";
import {
  getMyApplications,
  withdrawApplication,
  updateApplicationStatus,
} from "../controllers/application.controller.js";

const router = Router();

// ── GET /api/applications/mine (candidate only, cached 60s) ───────────────────
router.get(
  "/mine",
  protect,
  authorizeRoles("candidate"),
  cacheResponse({
    ttl: 60,
    keyBuilder: (req) => `cache:applications:mine:${req.user._id}:${req.originalUrl}`,
  }),
  getMyApplications
);

// ── PATCH /api/applications/:id/withdraw (candidate owner only) ───────────────
router.patch(
  "/:id/withdraw",
  protect,
  authorizeRoles("candidate"),
  withdrawApplication
);

// ── PATCH /api/applications/:id/status (recruiter owner only) ─────────────────
router.patch(
  "/:id/status",
  protect,
  authorizeRoles("recruiter"),
  validate(updateApplicationStatusSchema),
  updateApplicationStatus
);

export default router;
