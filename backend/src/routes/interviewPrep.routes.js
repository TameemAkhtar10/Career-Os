import { Router } from "express";
import rateLimit from "express-rate-limit";
import { getRateLimitStore } from "../config/redis.js";
import {
  getBasics,
  getUsage,
  generateQuestions,
  generateFeedback,
  generateAiAnswer,
  generateFinalReport,
  downloadReportPdf,
  saveSession,
  getSessions,
  deleteSession,
  deleteAllSessions,
} from "../controllers/interviewPrep.controller.js";
import { protect, authorizeRoles } from "../middlewares/auth.middleware.js";

const router = Router();

const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  store: getRateLimitStore("rl:interview-prep:ai:"),
  message: {
    success: false,
    message: "Too many interview prep requests. Please wait a moment.",
  },
});

const pdfLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 25,
  standardHeaders: true,
  legacyHeaders: false,
  store: getRateLimitStore("rl:interview-prep:pdf:"),
  message: {
    success: false,
    message: "Too many PDF download requests. Please wait a moment.",
  },
});

// Public / Candidate basic question library
router.get("/basics", getBasics);

// Candidate authenticated routes
router.use(protect, authorizeRoles("candidate"));

router.get("/usage", getUsage);
router.post("/questions", aiLimiter, generateQuestions);
router.post("/feedback", aiLimiter, generateFeedback);
router.post("/ai-answer", aiLimiter, generateAiAnswer);
router.post("/report", aiLimiter, generateFinalReport);
router.post("/report/pdf", pdfLimiter, downloadReportPdf);
router.post("/sessions", saveSession);
router.get("/sessions", getSessions);
router.delete("/sessions", deleteAllSessions);
router.delete("/sessions/:id", deleteSession);

export default router;
