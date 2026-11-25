import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import {
  stripAtsReference,
  guardQuestions,
  guardResumeDrivenQuestions,
  guardFeedback,
  guardBetterAnswer,
  computeReportStats,
  guardReport,
  extractNumbers,
} from "../src/utils/interviewGuard.js";
import {
  getDailyLimit,
  reserveDailyQuota,
  rollbackDailyQuota,
  getUsage,
} from "../src/controllers/interviewPrep.controller.js";
import { generateInterviewReportPdfBuffer } from "../src/services/interviewReportPdf.service.js";

const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse/lib/pdf-parse.js");

test("stripAtsReference removes ATS occurrences and replaces with automated screening", () => {
  const input = "Optimized for ATS parsers and ranking algorithms.";
  const cleaned = stripAtsReference(input);
  assert.equal(cleaned.includes("ATS"), false);
  assert.equal(cleaned.includes("automated screening"), true);
});

test("guardQuestions ensures minimum length and strips ATS mentions", () => {
  const rawQuestions = [
    {
      id: "q1",
      category: "technical",
      question: "How do you optimize React code for ATS screening?",
      whyAsked: "Checks ATS awareness",
      hints: ["Look at ATS keywords"],
    },
    {
      id: "q2",
      category: "invalid_category",
      question: "Short?",
    },
  ];

  const guarded = guardQuestions(rawQuestions);
  assert.equal(guarded.length, 1);
  assert.equal(guarded[0].category, "technical");
  assert.equal(guarded[0].question.includes("ATS"), false);
  assert.equal(guarded[0].question.includes("automated screening"), true);
  assert.equal(guarded[0].hints[0].includes("ATS"), false);
});

test("guardResumeDrivenQuestions drops invented projects/tools and triggers 40% fallback", () => {
  const resumeMap = {
    projects: [{ name: "Career Tracker", stack: ["React", "Node.js", "MongoDB"], summary: "Job tracker app" }],
    skills: ["React", "Node.js", "MongoDB", "JavaScript"],
  };

  // Case 1: 1 out of 3 dropped (<= 40%) -> keeps grounded questions
  const mixedQuestions = [
    {
      id: "q1",
      category: "project",
      relatedTo: "Career Tracker",
      question: "In Career Tracker, how did you structure your React state and MongoDB queries?",
      whyAsked: "Checks project depth",
      hints: ["Discuss state flow"],
      difficulty: "medium",
    },
    {
      id: "q2",
      category: "project",
      relatedTo: "Fake Crypto Exchange",
      question: "In Fake Crypto Exchange, how did you deploy Kubernetes clusters?",
      whyAsked: "Invented project",
      hints: [],
      difficulty: "hard",
    },
    {
      id: "q3",
      category: "hr",
      question: "Tell me about a time you learned a new concept quickly for ATS readiness.",
      whyAsked: "Checks adaptability",
      hints: ["Keep it concise"],
      difficulty: "easy",
    },
  ];

  const res1 = guardResumeDrivenQuestions(mixedQuestions, {
    resumeMap,
    jobSkills: ["React"],
    redactedResumeText: "Built Career Tracker using React, Node.js, and MongoDB.",
    fallbackQuestions: [{ id: "fb1", category: "hr", question: "Fallback question?" }],
  });

  assert.equal(res1.aiAvailable, true);
  assert.equal(res1.droppedCount, 1);
  assert.equal(res1.questions.length, 2);
  assert.equal(/ATS/i.test(res1.questions[1].question), false);

  // Case 2: 2 out of 3 dropped (> 40%) -> triggers fallback
  const mostlyHallucinated = [
    {
      id: "q1",
      category: "skills",
      question: "How did you configure Kubernetes and Terraform in your production pipeline?",
      whyAsked: "Ungrounded tools",
      hints: [],
    },
    {
      id: "q2",
      category: "project",
      relatedTo: "Invented ERP",
      question: "Walk me through your Invented ERP project using Rust.",
      whyAsked: "Ungrounded project",
      hints: [],
    },
    {
      id: "q3",
      category: "hr",
      question: "Why do you want to join our engineering team?",
      whyAsked: "Standard HR",
      hints: [],
    },
  ];

  const fallback = [{ id: "fb1", category: "hr", question: "Tell me about yourself." }];
  const res2 = guardResumeDrivenQuestions(mostlyHallucinated, {
    resumeMap,
    jobSkills: ["React"],
    redactedResumeText: "Built Career Tracker using React and Node.js.",
    fallbackQuestions: fallback,
  });

  assert.equal(res2.aiAvailable, false);
  assert.equal(res2.questions.length, 1);
  assert.equal(res2.questions[0].id, "fb1");
});

test("guardBetterAnswer preserves placeholders and enforces project vs concept grounding", () => {
  const resumeMap = {
    projects: [{ name: "Career Tracker", stack: ["React", "MongoDB"], summary: "Built job tracker" }],
    skills: ["React", "MongoDB"],
  };

  // Project question with placeholders and grounded tools -> kept
  const validProjAnswer =
    "In Career Tracker, I worked as [your role] using React and MongoDB. It served [number of users] users and taught me clean API design.";
  const projOk = guardBetterAnswer(validProjAnswer, {
    category: "project",
    resumeMap,
    question: "Tell me about Career Tracker.",
    answer: "I built Career Tracker with React.",
  });
  assert.equal(projOk.betterAnswerUnavailable, false);
  assert.equal(projOk.betterAnswer.includes("[your role]"), true);
  assert.equal(projOk.betterAnswer.includes("[number of users]"), true);

  // Project question with >40% hallucinated metrics/tools -> unavailable
  const badProjAnswer =
    "I scaled Career Tracker to 50000 users using Kubernetes and Redis. Latency dropped by 75% across 12 microservices.";
  const projBad = guardBetterAnswer(badProjAnswer, {
    category: "project",
    resumeMap,
    question: "Tell me about Career Tracker.",
    answer: "I built Career Tracker with React.",
  });
  assert.equal(projBad.betterAnswerUnavailable, true);
  assert.equal(projBad.betterAnswer, "");

  // Concept/skills question allows accurate technical explanation
  const conceptAnswer =
    "In React, useEffect runs side effects after render. For example, fetching data from an API with a cleanup function prevents stale state updates.";
  const skillOk = guardBetterAnswer(conceptAnswer, {
    category: "skills",
    resumeMap,
    question: "Explain useEffect in React.",
    answer: "",
  });
  assert.equal(skillOk.betterAnswerUnavailable, false);
  assert.equal(skillOk.betterAnswer.includes("useEffect"), true);
});

test("guardFeedback enforces score bounding and metric grounding", () => {
  const candidateAnswer = "I built an e-commerce website using React and Node.js. It had 50 active users.";

  const hallucinatedFeedback = {
    score: 10,
    strengths: ["Great technical clarity"],
    improvements: ["Mention performance"],
    betterStructure: "State how you improved latency by 85% and reduced CPU load by 40% saving $50000.",
    followUpQuestion: "What database indexing was used?",
  };

  const guarded = guardFeedback(hallucinatedFeedback, candidateAnswer);
  assert.equal(guarded.score, 5);
  assert.equal(guarded.betterStructure.includes("$50000"), false);
  assert.equal(guarded.aiAvailable, true);
});

test("daily limit defaults to 25, counts only successful calls, throws 429 when exceeded, and rolls back failed calls", async () => {
  const prevLimit = process.env.INTERVIEW_PREP_DAILY_LIMIT;
  delete process.env.INTERVIEW_PREP_DAILY_LIMIT;
  try {
    assert.equal(getDailyLimit(), 25);

    // In-memory mock of InterviewPrepDailyCount
    let storedCount = 0;
    const MockCountModel = {
    findOne() {
  return {
    lean: async () =>
      storedCount === 0 ? null : { count: storedCount },
  };
},
      async create() {
        storedCount = 1;
        return { count: storedCount };
      },
      async findOneAndUpdate(filter) {
        const lt = filter?.count?.$lt ?? 25;
        if (storedCount < lt) {
          storedCount += 1;
          return { count: storedCount };
        }
        return null;
      },
      async updateOne(_filter, update) {
        if (update?.$inc?.count === -1 && storedCount > 0) {
          storedCount -= 1;
        }
      },
    };

    // Reserve 25 successful slots
    for (let i = 1; i <= 25; i++) {
      const q = await reserveDailyQuota("user1", MockCountModel);
      assert.equal(q.used, i);
      assert.equal(q.limit, 25);
    }

    // 26th call throws 429
    await assert.rejects(
      () => reserveDailyQuota("user1", MockCountModel),
      (err) => err.statusCode === 429
    );

    // Simulate failed AI call rollback -> slot freed, next call succeeds
    await rollbackDailyQuota("user1", "2026-11-25", MockCountModel);
    assert.equal(storedCount, 24);
    const afterRollback = await reserveDailyQuota("user1", MockCountModel);
    assert.equal(afterRollback.used, 25);
  } finally {
    if (prevLimit !== undefined) process.env.INTERVIEW_PREP_DAILY_LIMIT = prevLimit;
  }
});

test("computeReportStats and guardReport exclude skipped and AI-assisted items from strengths", () => {
  const items = [
    {
      question: "Explain React hooks",
      category: "skills",
      relatedTo: "React",
      answer: "Hooks let functional components use state and lifecycle.",
      score: 4,
      skipped: false,
      usedAiAnswer: false,
    },
    {
      question: "How did you optimize Career Tracker?",
      category: "project",
      relatedTo: "Career Tracker",
      answer: "[Used AI Sample Answer]",
      score: null,
      skipped: false,
      usedAiAnswer: true,
    },
    {
      question: "Tell me about a conflict.",
      category: "hr",
      relatedTo: "",
      answer: "",
      score: null,
      skipped: true,
      usedAiAnswer: false,
    },
  ];

  const stats = computeReportStats(items);
  assert.equal(stats.totalQuestions, 3);
  assert.equal(stats.answeredCount, 1);
  assert.equal(stats.aiAssistedCount, 1);
  assert.equal(stats.skippedCount, 1);
  assert.equal(stats.averageScore, 4);
  assert.equal(stats.categoryAverages.skills.average, 4);
  assert.equal(stats.projectAverages["Career Tracker"].aiAssistedCount, 1);
  assert.equal(stats.strongestAreas.includes("skills"), true);
  assert.equal(stats.strongestAreas.includes("project"), false);
  assert.equal(stats.strongestAreas.includes("hr"), false);

  const guarded = guardReport(
    {
      headline: "Solid React fundamentals, needs project practice.",
      summary: "You answered React well but used AI help on Career Tracker.",
      strengths: [
        "Clear explanation of React hooks.",
        "Strong ownership of Career Tracker optimization.", // Should be filtered out (AI-assisted only)
      ],
      weakAreas: [
        {
          area: "Project Deep-Dive",
          relatedTo: "Career Tracker",
          whyItMatters: "Interviewers probe your actual project trade-offs.",
          fix: "Practice explaining one bug and one database choice in Career Tracker.",
        },
      ],
      answerHabits: ["Good conciseness on technical definitions."],
      projectReadiness: [{ project: "Career Tracker", score: 2, note: "Used AI sample answer." }],
      topicsToStudy: [
        {
          topic: "React & ATS basics",
          reason: "Improve depth",
          practice: "Build a form with validation https://example.com",
        },
      ],
      nextSteps: ["Day 1-2: Review Career Tracker architecture."],
    },
    stats,
    items
  );

  assert.equal(guarded.strengths.length, 1);
  assert.equal(guarded.strengths[0].includes("React hooks"), true);
  assert.equal(/ATS/i.test(guarded.topicsToStudy[0].topic), false);
  assert.equal(/https?:\/\//i.test(guarded.topicsToStudy[0].practice), false);
});

test("generateInterviewReportPdfBuffer produces text-extractable PDF with required headings", async () => {
  const buffer = await generateInterviewReportPdfBuffer({
    role: "Junior Frontend Developer",
    date: "25 Nov 2026",
    stats: {
      totalQuestions: 2,
      answeredCount: 1,
      aiAssistedCount: 1,
      skippedCount: 0,
      averageScore: 4,
    },
    report: {
      headline: "Good React basics; practice explaining your project.",
      summary: "You scored 4/5 on your own answer and used AI assistance once.",
      strengths: ["Clear explanation of React state."],
      weakAreas: [
        {
          area: "Project Architecture",
          relatedTo: "Career Tracker",
          whyItMatters: "Shows ownership.",
          fix: "Rehearse your API design.",
        },
      ],
      answerHabits: ["Concise answers."],
      projectReadiness: [{ project: "Career Tracker", score: 3, note: "Needs more detail." }],
      topicsToStudy: [{ topic: "REST APIs", reason: "Core skill", practice: "Write CRUD endpoints." }],
      nextSteps: ["Day 1-2: Practice project walkthrough."],
    },
    items: [
      {
        question: "Explain React state.",
        category: "skills",
        relatedTo: "React",
        score: 4,
        skipped: false,
        usedAiAnswer: false,
      },
      {
        question: "Explain Career Tracker auth.",
        category: "project",
        relatedTo: "Career Tracker",
        score: null,
        skipped: false,
        usedAiAnswer: true,
      },
    ],
  });

  assert.ok(Buffer.isBuffer(buffer));
  assert.ok(buffer.length > 500);

  const parsed = await pdfParse(buffer);
  const text = parsed.text || "";
  assert.ok(text.includes("Career OS"));
  assert.ok(text.includes("Score Summary"));
  assert.ok(text.includes("Per-Question Breakdown"));
  assert.ok(text.includes("Strengths"));
  assert.ok(text.includes("Areas to Improve"));
  assert.ok(text.includes("7-Day Preparation Plan"));
  assert.ok(text.includes("Practice report generated by Career OS. An estimate to help you prepare."));
});

test("getUsage handler is exported and does not invoke AI", () => {
  assert.equal(typeof getUsage, "function");
});
