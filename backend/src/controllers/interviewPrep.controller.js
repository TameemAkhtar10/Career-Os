import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { env } from "../config/env.js";
import { generateJson } from "../services/ai.service.js";
import { CandidateProfile } from "../models/candidateProfile.model.js";
import { Job } from "../models/job.model.js";
import { InterviewPrepDailyCount } from "../models/InterviewPrepDailyCount.js";
import { InterviewSession } from "../models/InterviewSession.js";
import { guardQuestions, guardFeedback } from "../utils/interviewGuard.js";

const MAX_SESSIONS = 50;

const STATIC_BASICS_QUESTIONS = [
  {
    id: "b_1",
    category: "hr",
    question: "Tell me about yourself and your journey into software development.",
    whyAsked: "Gauges clarity of thought, communication skills, and personal enthusiasm.",
    hints: [
      "Briefly state your education / background",
      "Mention 1-2 key technical projects or languages you enjoy",
      "Explain why you are excited for this specific role",
    ],
    difficulty: "easy",
  },
  {
    id: "b_2",
    category: "technical",
    question: "Walk me through the most technically challenging project you built.",
    whyAsked: "Tests hands-on problem solving, depth of architectural understanding, and ownership.",
    hints: [
      "Describe the problem and tech stack chosen",
      "Explain a specific roadblock you encountered and how you solved it",
      "Share the outcome, live link, or what you would improve",
    ],
    difficulty: "medium",
  },
  {
    id: "b_3",
    category: "technical",
    question: "What happens under the hood when you type a URL into a browser and press Enter?",
    whyAsked: "Evaluates foundational understanding of computer networks, DNS, HTTP, and browser rendering.",
    hints: [
      "Mention DNS lookup and IP resolution",
      "TCP handshake (SYN, SYN-ACK, ACK) and TLS negotiation",
      "HTTP GET request and server response",
      "DOM, CSSOM tree creation and rendering pipeline",
    ],
    difficulty: "medium",
  },
  {
    id: "b_4",
    category: "technical",
    question: "Explain the difference between synchronous and asynchronous code with a real-world example.",
    whyAsked: "Checks grasp of concurrency, event loop, and non-blocking I/O.",
    hints: [
      "Define blocking vs non-blocking execution",
      "Mention promises, async/await, or callback queues",
      "Contrast reading a file from disk / database query with in-memory calculation",
    ],
    difficulty: "easy",
  },
  {
    id: "b_5",
    category: "technical",
    question: "How do relational databases differ from NoSQL databases, and when would you pick which?",
    whyAsked: "Evaluates database schema design choices and scalability trade-offs.",
    hints: [
      "ACID compliance and structured schema in SQL",
      "Horizontal scaling and schema flexibility in NoSQL",
      "Provide an example use case for each (e.g., payments vs user feeds)",
    ],
    difficulty: "medium",
  },
  {
    id: "b_6",
    category: "behavioral",
    question: "Tell me about a time you had a disagreement with a project teammate. How did you resolve it?",
    whyAsked: "Assesses emotional intelligence, teamwork, and constructive conflict resolution.",
    hints: [
      "Focus on the technical problem, not personal criticism",
      "Explain how you listened to their perspective",
      "Highlight the objective data or benchmark used to decide",
    ],
    difficulty: "easy",
  },
  {
    id: "b_7",
    category: "situational",
    question: "If you are stuck on a difficult bug for more than two hours, what is your approach?",
    whyAsked: "Tests resourcefulness, debugging methodology, and knowing when to ask for help.",
    hints: [
      "Systematic isolation: logs, minimal reproducible example",
      "Documentation and official resources",
      "Summarizing findings before asking a senior colleague",
    ],
    difficulty: "easy",
  },
  {
    id: "b_8",
    category: "technical",
    question: "What is Git version control, and how do you resolve a merge conflict?",
    whyAsked: "Validates practical developer workflow and collaboration essentials.",
    hints: [
      "Working directory, staging, commit history",
      "Identify conflicting lines in code editor",
      "Test build after resolving before completing merge commit",
    ],
    difficulty: "easy",
  },
  {
    id: "b_9",
    category: "technical",
    question: "What are REST API best practices, and what does idempotency mean?",
    whyAsked: "Tests modern backend web standards and API design literacy.",
    hints: [
      "HTTP methods: GET, POST, PUT, DELETE, PATCH",
      "Standard status codes: 200, 201, 400, 401, 404, 500",
      "Idempotent methods (GET, PUT, DELETE) produce identical state when repeated",
    ],
    difficulty: "medium",
  },
  {
    id: "b_10",
    category: "hr",
    question: "Why do you want to join our engineering team over other companies?",
    whyAsked: "Checks company research, cultural alignment, and career motivation.",
    hints: [
      "Reference specific products, tech stack, or engineering blogs",
      "Align with your early career learning goals",
      "Express excitement for shipping impact to real users",
    ],
    difficulty: "easy",
  },
  {
    id: "b_11",
    category: "technical",
    question: "What is time complexity and space complexity (Big O notation)? Why does it matter?",
    whyAsked: "Evaluates algorithms baseline and appreciation for code efficiency.",
    hints: [
      "O(1), O(log n), O(n), O(n log n), O(n^2)",
      "Best vs worst vs average case scenarios",
      "Explain how data volume growth affects production servers",
    ],
    difficulty: "medium",
  },
  {
    id: "b_12",
    category: "behavioral",
    question: "Describe a project where you had to learn a completely new technology under a deadline.",
    whyAsked: "Measures adaptability, self-directed learning velocity, and grit.",
    hints: [
      "State what the technology was and why it was required",
      "Explain how you quickly got up to speed (docs, tutorials, small proof-of-concept)",
      "Share the delivered outcome",
    ],
    difficulty: "easy",
  },
];

const getTodayDateKey = () => {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
};

const checkAndIncrementDailyLimit = async (userId) => {
  const dateKey = getTodayDateKey();
  const limit = env.INTERVIEW_PREP_DAILY_LIMIT || 10;

  const record = await InterviewPrepDailyCount.findOneAndUpdate(
    { user: userId, dateKey },
    { $inc: { count: 1 } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  if (record.count > limit) {
    throw new ApiError(
      429,
      `Daily interview preparation limit reached (${limit} practice rounds per day). Please return tomorrow.`
    );
  }

  return { used: record.count, limit, remaining: Math.max(0, limit - record.count) };
};

/**
 * GET /api/interview-prep/basics
 * Static non-AI question catalog for instant offline prep
 */
export const getBasics = asyncHandler(async (_req, res) => {
  return res.status(200).json(
    new ApiResponse(
      200,
      {
        questions: STATIC_BASICS_QUESTIONS,
        total: STATIC_BASICS_QUESTIONS.length,
      },
      "Static interview question catalog fetched successfully"
    )
  );
});

/**
 * POST /api/interview-prep/questions
 * Generates tailor-made interview questions grounded strictly in candidate resume and target role.
 */
export const generateQuestions = asyncHandler(async (req, res) => {
  const user = req.user;
  const { jobId, role, focus = "mixed", level = "fresher" } = req.body;

  if (user.role !== "candidate") {
    throw new ApiError(403, "Interview preparation is exclusively available for candidates.");
  }

  // Ensure AI consent
  if (!user.aiConsent?.resumeAnalysis?.granted) {
    throw new ApiError(403, "AI consent is required before analyzing your profile for interview prep.");
  }

  let jobTitle = role || "Software Engineer";
  let jobSkills = [];
  let jobDescription = "";

  if (jobId) {
    const job = await Job.findById(jobId).lean();
    if (job) {
      jobTitle = job.title;
      jobSkills = job.skills || [];
      jobDescription = job.description?.slice(0, 1000) || "";
    }
  }

  // Fetch candidate profile for grounded context
  const profile = await CandidateProfile.findOne({ user: user._id }).lean();
  const candidateSkills = profile?.skills || [];
  const candidateProjects = (profile?.projects || [])
    .map((p) => `${p.title}: ${p.description || ""}`)
    .slice(0, 3)
    .join("\n");

  // Check rate limit before AI invocation
  const quota = await checkAndIncrementDailyLimit(user._id);

  const prompt = `You are a friendly, rigorous Indian tech company hiring manager interviewing a fresher/entry-level candidate for the role of "${jobTitle}".
Generate 5 realistic, high-signal interview questions tailored to the candidate's skills and target job.

Candidate Skills: ${candidateSkills.join(", ") || "General Computer Science"}
Candidate Projects: ${candidateProjects || "Standard academic/portfolio projects"}
Target Job Skills: ${jobSkills.join(", ") || "Core software engineering"}
Interview Focus: ${focus} (technical / behavioral / situational / mixed)
Level: ${level}

Guidelines:
- Indian fresher interview context (service or product companies: TCS, Infosys, Cognizant, startups, product firms).
- Mix: core language concepts, system thinking, project deep-dive, and realistic team situations.
- NEVER mention "ATS" or "automated screening algorithms".
- Provide 2-3 constructive hints per question.

Return strictly a JSON object with this shape:
{
  "questions": [
    {
      "id": "q1",
      "category": "technical",
      "question": "question text",
      "whyAsked": "why the interviewer asks this",
      "hints": ["hint 1", "hint 2"],
      "difficulty": "easy | medium | hard"
    }
  ]
}`;

  let questions = [];
  try {
    const result = await generateJson({
      prompt,
      systemInstruction: "You are an expert technical interviewer for Indian software engineers. Output valid JSON only.",
    });
    questions = guardQuestions(result?.questions || []);
  } catch (err) {
    console.error("AI question generation error, falling back to static questions:", err.message);
    questions = STATIC_BASICS_QUESTIONS.slice(0, 5);
  }

  if (!questions || questions.length === 0) {
    questions = STATIC_BASICS_QUESTIONS.slice(0, 5);
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        role: jobTitle,
        focus,
        level,
        questions,
        quota,
      },
      "Interview questions generated successfully"
    )
  );
});

/**
 * POST /api/interview-prep/feedback
 * Evaluates candidate's written or recorded answer without hallucinating metrics.
 */
export const generateFeedback = asyncHandler(async (req, res) => {
  const user = req.user;
  const { question, answer, category = "technical", role = "Software Engineer" } = req.body;

  if (user.role !== "candidate") {
    throw new ApiError(403, "Interview preparation is exclusively available for candidates.");
  }

  if (!question || !answer || answer.trim().length < 5) {
    throw new ApiError(400, "Both question and a substantive answer are required for feedback.");
  }

  if (!user.aiConsent?.resumeAnalysis?.granted) {
    throw new ApiError(403, "AI consent is required before evaluating interview responses.");
  }

  const quota = await checkAndIncrementDailyLimit(user._id);

  const prompt = `You are an empathetic senior engineering lead coaching a fresher candidate.
Role: ${role}
Category: ${category}
Question: ${question}
Candidate's Answer:
"${answer}"

Evaluate the candidate's answer with actionable, encouraging feedback.
Strict Hallucination Constraints:
- Score from 1 to 5 (1: Poor, 3: Decent, 5: Outstanding).
- In strengths and improvements, focus on clarity, depth, correctness, and structure.
- In betterStructure, provide a polished blueprint using STAR (Situation, Task, Action, Result).
- CRITICAL: Do NOT invent metrics, percentages, dollar amounts, or company names not mentioned in the candidate's answer.
- NEVER mention "ATS" or "algorithmic screening".

Return strictly a JSON object:
{
  "score": 4,
  "strengths": ["Clear explanation of concept", "Good mention of edge cases"],
  "improvements": ["Could structure using STAR framework", "Mention specific testing approach"],
  "betterStructure": "Polished concise exemplar structure",
  "followUpQuestion": "A natural follow-up question the interviewer would ask next"
}`;

  let feedback;
  try {
    const rawResult = await generateJson({
      prompt,
      systemInstruction: "You are a senior tech interviewer evaluating candidates. Output valid JSON only.",
    });
    feedback = guardFeedback(rawResult, answer);
  } catch (err) {
    console.error("AI feedback error:", err.message);
    feedback = guardFeedback(null, answer);
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        feedback,
        quota,
      },
      "Answer evaluation generated successfully"
    )
  );
});

/**
 * POST /api/interview-prep/sessions
 * Saves a completed practice session (max 50 sessions per candidate)
 */
export const saveSession = asyncHandler(async (req, res) => {
  const user = req.user;
  const { role, level = "fresher", focus = "mixed", items = [], jobId } = req.body;

  if (user.role !== "candidate") {
    throw new ApiError(403, "Candidates only.");
  }

  // Enforce 50 sessions limit: auto-prune oldest if needed
  const totalSessions = await InterviewSession.countDocuments({ user: user._id });
  if (totalSessions >= MAX_SESSIONS) {
    const oldest = await InterviewSession.find({ user: user._id })
      .sort({ createdAt: 1 })
      .limit(totalSessions - MAX_SESSIONS + 1);
    const idsToPrune = oldest.map((s) => s._id);
    await InterviewSession.deleteMany({ _id: { $in: idsToPrune } });
  }

  const session = await InterviewSession.create({
    user: user._id,
    job: jobId || null,
    role: role || "Software Engineer",
    level,
    focus,
    items,
  });

  return res.status(201).json(new ApiResponse(201, session, "Interview session saved successfully"));
});

/**
 * GET /api/interview-prep/sessions
 * Lists user's practice sessions
 */
export const getSessions = asyncHandler(async (req, res) => {
  const sessions = await InterviewSession.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .lean();

  return res.status(200).json(new ApiResponse(200, sessions, "Interview sessions retrieved"));
});

/**
 * DELETE /api/interview-prep/sessions/:id
 */
export const deleteSession = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const session = await InterviewSession.findOneAndDelete({ _id: id, user: req.user._id });
  if (!session) {
    throw new ApiError(404, "Session not found");
  }

  return res.status(200).json(new ApiResponse(200, { deleted: true }, "Session removed"));
});
