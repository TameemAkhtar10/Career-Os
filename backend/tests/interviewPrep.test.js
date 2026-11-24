import test from "node:test";
import assert from "node:assert/strict";
import {
  stripAtsReference,
  guardQuestions,
  guardFeedback,
  extractNumbers,
} from "../src/utils/interviewGuard.js";

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
      question: "Short?", // Less than 10 chars -> should be dropped
    },
  ];

  const guarded = guardQuestions(rawQuestions);
  assert.equal(guarded.length, 1);
  assert.equal(guarded[0].category, "technical");
  assert.equal(guarded[0].question.includes("ATS"), false);
  assert.equal(guarded[0].question.includes("automated screening"), true);
  assert.equal(guarded[0].hints[0].includes("ATS"), false);
});

test("guardFeedback enforces score bounding and metric grounding", () => {
  const candidateAnswer = "I built an e-commerce website using React and Node.js. It had 50 active users.";
  
  const hallucinatedFeedback = {
    score: 10, // out of bounds
    strengths: ["Great technical clarity"],
    improvements: ["Mention performance"],
    betterStructure: "State how you improved latency by 85% and reduced CPU load by 40% saving $50000.",
    followUpQuestion: "What database indexing was used?",
  };

  const guarded = guardFeedback(hallucinatedFeedback, candidateAnswer);
  assert.equal(guarded.score, 5); // Bounded to max 5
  // Over 40% hallucinated numbers -> sanitized structure
  assert.equal(guarded.betterStructure.includes("$50000"), false);
  assert.equal(guarded.aiAvailable, true);
});
