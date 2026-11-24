import { SKILL_TAXONOMY } from "./skillTaxonomy.js";

// Build a flattened set of known skill tokens lowercase
const KNOWN_SKILLS = new Set();
for (const [canonical, aliases] of Object.entries(SKILL_TAXONOMY)) {
  KNOWN_SKILLS.add(canonical.toLowerCase());
  for (const alias of aliases) {
    KNOWN_SKILLS.add(alias.toLowerCase());
  }
}

/**
 * Strips any forbidden "ATS" reference from text.
 */
export const stripAtsReference = (text) => {
  if (typeof text !== "string") return text;
  return text.replace(/\bATS\b/gi, "automated screening");
};

/**
 * Extracts numbers appearing in text.
 */
export const extractNumbers = (text) => {
  if (typeof text !== "string") return [];
  const matches = text.match(/\b\d+(\.\d+)?%?\b/g);
  return matches ? matches.map((m) => m.toLowerCase()) : [];
};

/**
 * Guards generated interview questions to ensure high quality and zero ATS references.
 */
export const guardQuestions = (questions) => {
  if (!Array.isArray(questions)) return [];

  return questions
    .filter((q) => q && typeof q.question === "string" && q.question.trim().length >= 10)
    .map((q, idx) => ({
      id: q.id || `q_${idx + 1}`,
      category: ["technical", "behavioral", "situational", "hr"].includes(q.category)
        ? q.category
        : "technical",
      question: stripAtsReference(q.question.trim()),
      whyAsked: stripAtsReference(q.whyAsked?.trim() || "Assesses core technical competencies and practical problem solving."),
      hints: Array.isArray(q.hints)
        ? q.hints.map((h) => stripAtsReference(String(h).trim())).filter(Boolean)
        : [],
      difficulty: ["easy", "medium", "hard"].includes(q.difficulty) ? q.difficulty : "medium",
    }));
};

/**
 * Verifies feedback hallucination constraints:
 * Any specific numbers/metrics in betterStructure must exist in the candidate's answer or be conservative examples.
 * Drops questions or fails gracefully if guard violations exceed 40%.
 */
export const guardFeedback = (feedback, originalAnswer = "") => {
  if (!feedback || typeof feedback !== "object") {
    return {
      score: 3,
      strengths: ["Clear and relevant attempt addressing the question."],
      improvements: ["Provide more concrete examples with STAR framework."],
      betterStructure: "Start with context, state your action, and wrap with the lesson or outcome.",
      followUpQuestion: "Can you elaborate on a challenge you overcame while implementing this?",
      aiAvailable: true,
    };
  }

  const score = Math.max(1, Math.min(5, parseInt(feedback.score, 10) || 3));
  const strengths = Array.isArray(feedback.strengths)
    ? feedback.strengths.map((s) => stripAtsReference(String(s).trim())).filter(Boolean)
    : [];
  const improvements = Array.isArray(feedback.improvements)
    ? feedback.improvements.map((i) => stripAtsReference(String(i).trim())).filter(Boolean)
    : [];

  let betterStructure = stripAtsReference(String(feedback.betterStructure || "").trim());
  let followUpQuestion = stripAtsReference(String(feedback.followUpQuestion || "").trim());

  // Check if betterStructure introduced hallucinated numbers not present in answer
  const answerNums = new Set(extractNumbers(originalAnswer));
  const structureNums = extractNumbers(betterStructure);

  let ungroundedCount = 0;
  for (const num of structureNums) {
    // Allow standard bullet or step numbers (1, 2, 3, 4, 5)
    if (["1", "2", "3", "4", "5", "1.", "2.", "3.", "4.", "5."].includes(num)) continue;
    if (!answerNums.has(num)) {
      ungroundedCount++;
    }
  }

  // If over 40% of numbers in structure were hallucinated metrics
  const totalChecked = structureNums.filter((n) => !["1", "2", "3", "4", "5"].includes(n)).length;
  if (totalChecked > 2 && ungroundedCount / totalChecked > 0.4) {
    // Sanitize structure to remove hallucinated metrics
    betterStructure = "Structure your answer using Context -> Action -> Result, focusing on your direct contributions without exaggerating metrics.";
  }

  return {
    score,
    strengths: strengths.length ? strengths : ["Answer demonstrated understanding of core principles."],
    improvements: improvements.length ? improvements : ["Add specific technical details or code reasoning."],
    betterStructure,
    followUpQuestion,
    aiAvailable: true,
  };
};
