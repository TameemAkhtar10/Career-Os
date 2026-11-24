import { Router } from "express";
import {
  getBasics,
  generateQuestions,
  generateFeedback,
  saveSession,
  getSessions,
  deleteSession,
} from "../controllers/interviewPrep.controller.js";
import { protect, authorizeRoles } from "../middlewares/auth.middleware.js";

const router = Router();

// Public / Candidate basic question library
router.get("/basics", getBasics);

// Candidate authenticated routes
router.use(protect, authorizeRoles("candidate"));

router.post("/questions", generateQuestions);
router.post("/feedback", generateFeedback);
router.post("/sessions", saveSession);
router.get("/sessions", getSessions);
router.delete("/sessions/:id", deleteSession);

export default router;
