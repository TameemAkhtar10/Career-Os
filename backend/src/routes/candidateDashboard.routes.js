import { Router } from "express";
import { protect, authorizeRoles } from "../middlewares/auth.middleware.js";
import { getCandidateDashboard } from "../controllers/candidateDashboard.controller.js";

const router = Router();

// ── GET /api/candidate/dashboard (candidate only) ─────────────────────────────
router.get("/dashboard", protect, authorizeRoles("candidate"), getCandidateDashboard);

export default router;

