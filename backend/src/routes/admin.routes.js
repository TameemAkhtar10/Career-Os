import { Router } from "express";
import rateLimit from "express-rate-limit";
import { protect, authorizeRoles } from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import {
  updateUserStatusSchema,
  updateJobStatusSchema,
  verifyRecruiterSchema,
} from "../validators/admin.schemas.js";
import {
  getStats,
  getUsers,
  updateUserStatus,
  getJobs,
  updateJobStatus,
  verifyRecruiter,
  getAuditLogs,
} from "../controllers/admin.controller.js";

const router = Router();

const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many admin requests. Please slow down." },
});

router.use(adminLimiter);
router.use(protect);
router.use(authorizeRoles("admin"));

// Statistics
router.get("/stats", getStats);

// User Management
router.get("/users", getUsers);
router.patch("/users/:id/status", validate(updateUserStatusSchema), updateUserStatus);

// Job Management
router.get("/jobs", getJobs);
router.patch("/jobs/:id/status", validate(updateJobStatusSchema), updateJobStatus);

// Recruiter Verification
router.patch("/recruiters/:userId/verify", validate(verifyRecruiterSchema), verifyRecruiter);

// Audit Trail
router.get("/audit-logs", getAuditLogs);

export default router;
