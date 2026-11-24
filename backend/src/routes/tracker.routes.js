import { Router } from "express";
import {
  getTrackerEntries,
  getTrackerSummary,
  createTrackerEntry,
  updateTrackerEntry,
  deleteTrackerEntry,
} from "../controllers/tracker.controller.js";
import { protect, authorizeRoles } from "../middlewares/auth.middleware.js";

const router = Router();

// Candidate-only routes
router.use(protect, authorizeRoles("candidate"));

router.get("/summary", getTrackerSummary);
router.get("/", getTrackerEntries);
router.post("/", createTrackerEntry);
router.patch("/:id", updateTrackerEntry);
router.delete("/:id", deleteTrackerEntry);

export default router;
