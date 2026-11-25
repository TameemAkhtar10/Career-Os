import { SKILL_TAXONOMY, extractSkillsFromText } from "./skillTaxonomy.js";

// Build a flattened set of known skill tokens lowercase
const KNOWN_SKILLS = new Set();
for (const [canonical, aliases] of Object.entries(SKILL_TAXONOMY)) {
  KNOWN_SKILLS.add(canonical.toLowerCase());
  for (const alias of aliases) {
    KNOWN_SKILLS.add(alias.toLowerCase());
  }
}

// Small allow-list of generic CS terms allowed in questions and concept answers
export const GENERIC_CS_TERMS = new Set([
  "http",
  "https",
  "rest",
  "api",
  "apis",
  "sql",
  "nosql",
  "git",
  "dom",
  "tcp",
  "udp",
  "dns",
  "oop",
  "mvc",
  "crud",
  "jwt",
  "oauth",
  "json",
  "xml",
  "css",
  "html",
  "big o",
  "ci/cd",
  "linux",
  "unit test",
  "unit testing",
  "database",
  "cache",
  "caching",
  "authentication",
  "authorization",
  "async",
  "promise",
  "promises",
  "recursion",
  "array",
  "hash map",
  "hashmap",
  "linked list",
  "stack",
  "queue",
  "tree",
  "graph",
  "algorithm",
  "algorithms",
  "data structure",
  "data structures",
  "microservices",
  "monolith",
  "debugging",
  "testing",
  "deployment",
  "agile",
  "scrum",
]);

/**
 * Strips any forbidden "ATS" reference from text.
 */
export const stripAtsReference = (text) => {
  if (typeof text !== "string") return text;
  return text.replace(/\bATS\b/gi, "automated screening");
};

/**
 * Extracts numbers appearing in text (ignoring bracketed placeholders like [50%] or [3 users]).
 */
export const extractNumbers = (text) => {
  if (typeof text !== "string") return [];
  const withoutBrackets = text.replace(/\[[^\]]*\]/g, " ");
  const matches = withoutBrackets.match(/\b\d+(\.\d+)?%?\b/g);
  return matches ? matches.map((m) => m.toLowerCase()) : [];
};

/**
 * Strictly validates and normalizes a resumeMap object from client/AI.
 */
export const validateResumeMap = (raw) => {
  if (!raw || typeof raw !== "object") {
    return { projects: [], skills: [] };
  }

  const projects = Array.isArray(raw.projects)
    ? raw.projects
        .filter((p) => p && typeof p.name === "string" && p.name.trim().length > 0)
        .slice(0, 15)
        .map((p) => ({
          name: stripAtsReference(p.name.trim().slice(0, 120)),
          stack: Array.isArray(p.stack)
            ? p.stack
                .map((s) => stripAtsReference(String(s).trim().slice(0, 50)))
                .filter(Boolean)
                .slice(0, 15)
            : [],
          summary: typeof p.summary === "string" ? stripAtsReference(p.summary.trim().slice(0, 300)) : "",
        }))
    : [];

  const skills = Array.isArray(raw.skills)
    ? Array.from(
        new Set(
          raw.skills
            .map((s) => stripAtsReference(String(s).trim().slice(0, 60)))
            .filter(Boolean)
        )
      ).slice(0, 50)
    : [];

  return { projects, skills };
};

const normalizeToken = (s) => String(s || "").toLowerCase().trim();

const buildAllowedSkillsSet = ({ resumeMap, jobSkills = [], redactedResumeText = "", question = "", answer = "" }) => {
  const allowed = new Set(GENERIC_CS_TERMS);

  if (resumeMap) {
    for (const s of resumeMap.skills || []) {
      allowed.add(normalizeToken(s));
    }
    for (const p of resumeMap.projects || []) {
      allowed.add(normalizeToken(p.name));
      for (const st of p.stack || []) {
        allowed.add(normalizeToken(st));
      }
    }
  }

  for (const js of jobSkills || []) {
    allowed.add(normalizeToken(js));
  }

  const combinedText = [redactedResumeText, question, answer].filter(Boolean).join("\n");
  if (combinedText) {
    for (const extracted of extractSkillsFromText(combinedText)) {
      allowed.add(normalizeToken(extracted));
    }
  }

  return allowed;
};

const findDisallowedSkillInText = (text, allowedSet, sourceTextLower = "") => {
  if (!text || typeof text !== "string") return null;
  const detected = extractSkillsFromText(text);
  for (const skill of detected) {
    const low = normalizeToken(skill);
    if (allowedSet.has(low)) continue;
    if (sourceTextLower && sourceTextLower.includes(low)) continue;
    return skill;
  }
  return null;
};

const isProjectNameGrounded = (relatedTo, resumeMap, redactedResumeText = "") => {
  if (!relatedTo || typeof relatedTo !== "string") return true;
  const relLow = normalizeToken(relatedTo);
  if (!relLow) return true;

  const projects = resumeMap?.projects || [];
  if (projects.some((p) => {
    const pLow = normalizeToken(p.name);
    return pLow === relLow || pLow.includes(relLow) || relLow.includes(pLow);
  })) {
    return true;
  }

  if (redactedResumeText && redactedResumeText.toLowerCase().includes(relLow)) {
    return true;
  }

  return false;
};

/**
 * Legacy-compatible question guard.
 */
export const guardQuestions = (questions) => {
  if (!Array.isArray(questions)) return [];

  const validCategories = ["project", "skills", "hr", "scenario", "technical", "behavioral", "situational"];

  return questions
    .filter((q) => q && typeof q.question === "string" && q.question.trim().length >= 10)
    .map((q, idx) => ({
      id: q.id || `q_${idx + 1}`,
      category: validCategories.includes(q.category) ? q.category : "technical",
      ...(q.relatedTo ? { relatedTo: stripAtsReference(String(q.relatedTo).trim().slice(0, 120)) } : {}),
      question: stripAtsReference(q.question.trim()),
      whyAsked: stripAtsReference(
        q.whyAsked?.trim() || "Assesses core technical competencies and practical problem solving."
      ),
      hints: Array.isArray(q.hints)
        ? q.hints.map((h) => stripAtsReference(String(h).trim())).filter(Boolean).slice(0, 3)
        : [],
      difficulty: ["easy", "medium", "hard"].includes(q.difficulty) ? q.difficulty : "medium",
    }));
};

/**
 * Guards resume-driven questions:
 * - Drops any question naming a project, company, or tool not in resumeMap, jobSkills, redactedResumeText, or GENERIC_CS_TERMS.
 * - Strips ATS references.
 * - If > 40% of questions are dropped (or 0 remain), returns aiAvailable: false with fallbackQuestions.
 */
export const guardResumeDrivenQuestions = (
  rawQuestions,
  { resumeMap = { projects: [], skills: [] }, jobSkills = [], redactedResumeText = "", fallbackQuestions = [] } = {}
) => {
  if (!Array.isArray(rawQuestions) || rawQuestions.length === 0) {
    return {
      aiAvailable: false,
      message: "Could not generate grounded questions. Showing foundational practice questions instead.",
      questions: fallbackQuestions,
      droppedCount: 0,
    };
  }

  const allowedSet = buildAllowedSkillsSet({ resumeMap, jobSkills, redactedResumeText });
  const sourceLower = [
    redactedResumeText,
    ...(resumeMap.projects || []).map((p) => `${p.name} ${(p.stack || []).join(" ")} ${p.summary}`),
    ...(resumeMap.skills || []),
    ...(jobSkills || []),
  ]
    .join(" ")
    .toLowerCase();

  const validCategories = new Set(["project", "skills", "hr", "scenario", "technical", "behavioral", "situational"]);
  const kept = [];
  let droppedCount = 0;

  for (let i = 0; i < rawQuestions.length; i++) {
    const q = rawQuestions[i];
    if (!q || typeof q.question !== "string" || q.question.trim().length < 10) {
      droppedCount++;
      continue;
    }

    const category = validCategories.has(q.category) ? q.category : "skills";
    const questionText = stripAtsReference(q.question.trim());
    const relatedTo = q.relatedTo ? stripAtsReference(String(q.relatedTo).trim().slice(0, 120)) : "";

    // Check for ungrounded project name if category is project
    if (category === "project") {
      if ((resumeMap.projects || []).length === 0) {
        // Resume has no projects; drop project-specific questions claiming a project
        droppedCount++;
        continue;
      }
      if (relatedTo && !isProjectNameGrounded(relatedTo, resumeMap, redactedResumeText)) {
        droppedCount++;
        continue;
      }
    }

    // Check for ungrounded tools/skills in question text
    const badSkill = findDisallowedSkillInText(questionText, allowedSet, sourceLower);
    if (badSkill) {
      droppedCount++;
      continue;
    }

    kept.push({
      id: q.id || `q_${kept.length + 1}`,
      category,
      ...(relatedTo ? { relatedTo } : {}),
      question: questionText,
      whyAsked: stripAtsReference(
        q.whyAsked?.trim() || "Evaluates your understanding and practical application."
      ),
      hints: Array.isArray(q.hints)
        ? q.hints.map((h) => stripAtsReference(String(h).trim())).filter(Boolean).slice(0, 3)
        : [],
      difficulty: ["easy", "medium", "hard"].includes(q.difficulty) ? q.difficulty : "medium",
    });
  }

  const dropRatio = rawQuestions.length > 0 ? droppedCount / rawQuestions.length : 1;
  if (dropRatio > 0.4 || kept.length === 0) {
    return {
      aiAvailable: false,
      message: "Generated questions referenced details outside your resume/role. Showing foundational questions instead.",
      questions: fallbackQuestions,
      droppedCount,
    };
  }

  return {
    aiAvailable: true,
    questions: kept,
    droppedCount,
  };
};

/**
 * Guards `betterAnswer` according to grounding rules:
 * - For project/HR/behavioral/situational/followup: numbers, tools, and project names must exist in resumeMap, question, or answer.
 *   Ungrounded sentences are removed; if >40% removed, returns empty with betterAnswerUnavailable: true.
 * - For skills/technical concept questions: allows accurate explanation, strips ATS, preserves [placeholders].
 */
export const guardBetterAnswer = (
  rawAnswer,
  { category = "skills", resumeMap = { projects: [], skills: [] }, question = "", answer = "" } = {}
) => {
  if (!rawAnswer || typeof rawAnswer !== "string" || !rawAnswer.trim()) {
    return { betterAnswer: "", betterAnswerUnavailable: true };
  }

  const cleaned = stripAtsReference(rawAnswer.trim());

  // Concept/skills questions allow technical explanation & small illustrative example
  if (category === "skills" || category === "technical") {
    return { betterAnswer: cleaned, betterAnswerUnavailable: false };
  }

  // Project / HR / Behavioral / Situational / Follow-up: strict grounding per sentence
  const allowedSet = buildAllowedSkillsSet({ resumeMap, question, answer });
  const sourceText = [
    question,
    answer,
    ...(resumeMap?.projects || []).map((p) => `${p.name} ${(p.stack || []).join(" ")} ${p.summary}`),
    ...(resumeMap?.skills || []),
  ]
    .filter(Boolean)
    .join(" ");
  const sourceLower = sourceText.toLowerCase();
  const allowedNumbers = new Set(extractNumbers(sourceText));

  const sentences = cleaned.match(/[^.!?]+[.!?]*/g) || [cleaned];
  const keptSentences = [];
  let removedCount = 0;

  for (const rawSent of sentences) {
    const sent = rawSent.trim();
    if (!sent) continue;

    // 1. Check unbracketed numbers
    const sentNums = extractNumbers(sent);
    const hasUngroundedNumber = sentNums.some((num) => {
      if (["1", "2", "3", "4", "5"].includes(num)) return false;
      return !allowedNumbers.has(num);
    });
    if (hasUngroundedNumber) {
      removedCount++;
      continue;
    }

    // 2. Check ungrounded tools/skills (ignore anything inside [brackets])
    const sentWithoutBrackets = sent.replace(/\[[^\]]*\]/g, " ");
    const badSkill = findDisallowedSkillInText(sentWithoutBrackets, allowedSet, sourceLower);
    if (badSkill) {
      removedCount++;
      continue;
    }

    keptSentences.push(sent);
  }

  const totalSentences = sentences.filter((s) => s.trim().length > 0).length;
  if (totalSentences === 0 || keptSentences.length === 0 || removedCount / totalSentences > 0.4) {
    return {
      betterAnswer: "",
      betterAnswerUnavailable: true,
    };
  }

  return {
    betterAnswer: keptSentences.join(" ").trim(),
    betterAnswerUnavailable: false,
  };
};

/**
 * Verifies feedback hallucination constraints:
 * Any specific numbers/metrics in betterStructure must exist in the candidate's answer or be conservative examples.
 * Also guards betterAnswer and respects askFollowUp flag.
 */
export const guardFeedback = (
  feedback,
  originalAnswer = "",
  { category = "skills", resumeMap = { projects: [], skills: [] }, question = "", askFollowUp = true } = {}
) => {
  if (!feedback || typeof feedback !== "object") {
    return {
      score: 3,
      strengths: ["Clear and relevant attempt addressing the question."],
      improvements: ["Provide more concrete examples with STAR framework."],
      betterStructure: "Start with context, state your action, and wrap with the lesson or outcome.",
      betterAnswer: "",
      betterAnswerUnavailable: true,
      followUpQuestion: askFollowUp
        ? "Can you elaborate on a challenge you overcame while implementing this?"
        : "",
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
  let followUpQuestion = askFollowUp
    ? stripAtsReference(String(feedback.followUpQuestion || "").trim())
    : "";

  // Check if betterStructure introduced hallucinated numbers not present in answer
  const answerNums = new Set(extractNumbers(originalAnswer));
  const structureNums = extractNumbers(betterStructure);

  let ungroundedCount = 0;
  for (const num of structureNums) {
    if (["1", "2", "3", "4", "5", "1.", "2.", "3.", "4.", "5."].includes(num)) continue;
    if (!answerNums.has(num)) {
      ungroundedCount++;
    }
  }

  const totalChecked = structureNums.filter((n) => !["1", "2", "3", "4", "5"].includes(n)).length;
  if (totalChecked > 2 && ungroundedCount / totalChecked > 0.4) {
    betterStructure =
      "Structure your answer using Context -> Action -> Result, focusing on your direct contributions without exaggerating metrics.";
  }

  const guardedBetter =
    typeof feedback.betterAnswer === "string" && feedback.betterAnswer.trim()
      ? guardBetterAnswer(feedback.betterAnswer, {
          category,
          resumeMap,
          question,
          answer: originalAnswer,
        })
      : { betterAnswer: "", betterAnswerUnavailable: true };

  return {
    score,
    strengths: strengths.length ? strengths : ["Answer demonstrated understanding of core principles."],
    improvements: improvements.length ? improvements : ["Add specific technical details or code reasoning."],
    betterStructure,
    betterAnswer: guardedBetter.betterAnswer,
    betterAnswerUnavailable: guardedBetter.betterAnswerUnavailable,
    followUpQuestion,
    aiAvailable: true,
  };
};

/**
 * Guards the "AI Answer" helper response.
 */
export const guardAiAnswer = (
  raw,
  { category = "skills", resumeMap = { projects: [], skills: [] }, question = "" } = {}
) => {
  if (!raw || typeof raw !== "object") {
    return {
      betterAnswer: "",
      betterAnswerUnavailable: true,
      keyPoints: ["Break down the core concept step-by-step.", "Use a simple, honest example.", "Keep your answer concise (1-2 minutes)."],
      howToDeliver: "Speak clearly, admit any gaps honestly, and focus on how you would reason through the problem.",
      followUpYouMayGet: "How would you apply this in a real project?",
    };
  }

  const guarded = guardBetterAnswer(raw.betterAnswer || "", {
    category,
    resumeMap,
    question,
    answer: "",
  });

  const keyPoints = Array.isArray(raw.keyPoints)
    ? raw.keyPoints.map((k) => stripAtsReference(String(k).trim())).filter(Boolean).slice(0, 5)
    : [];

  return {
    betterAnswer: guarded.betterAnswer,
    betterAnswerUnavailable: guarded.betterAnswerUnavailable,
    keyPoints: keyPoints.length
      ? keyPoints
      : ["Define the core idea clearly.", "Walk through a concrete step-by-step flow.", "Mention one trade-off or edge case."],
    howToDeliver: stripAtsReference(
      String(raw.howToDeliver || "Deliver this calmly in 60–90 seconds, pausing briefly after your main point.").trim()
    ),
    followUpYouMayGet: stripAtsReference(
      String(raw.followUpYouMayGet || "Can you walk through an edge case for this?").trim()
    ),
  };
};

/**
 * Computes deterministic stats from completed interview items.
 * Skipped and AI-assisted items are tracked separately and excluded from own-answer strengths.
 */
export const computeReportStats = (items = []) => {
  const safeItems = Array.isArray(items) ? items : [];
  const totalQuestions = safeItems.length;
  let skippedCount = 0;
  let aiAssistedCount = 0;
  let answeredCount = 0;

  let ownScoreSum = 0;
  let ownScoredCount = 0;

  const catBuckets = new Map();
  const projectBuckets = new Map();
  const skillBuckets = new Map();

  for (const item of safeItems) {
    if (!item) continue;
    const isSkipped = Boolean(item.skipped);
    const isAiAssisted = Boolean(item.usedAiAnswer);
    const hasScore = typeof item.score === "number" && item.score >= 1 && item.score <= 5;

    if (isSkipped) {
      skippedCount++;
    } else if (isAiAssisted) {
      aiAssistedCount++;
    } else {
      answeredCount++;
      if (hasScore) {
        ownScoreSum += item.score;
        ownScoredCount++;
      }
    }

    const cat = item.category || "skills";
    if (!catBuckets.has(cat)) {
      catBuckets.set(cat, { sum: 0, count: 0, total: 0, skipped: 0, aiAssisted: 0 });
    }
    const cb = catBuckets.get(cat);
    cb.total++;
    if (isSkipped) cb.skipped++;
    else if (isAiAssisted) cb.aiAssisted++;
    else if (hasScore) {
      cb.sum += item.score;
      cb.count++;
    }

    const rel = typeof item.relatedTo === "string" ? item.relatedTo.trim() : "";
    if (rel) {
      const targetMap = cat === "project" ? projectBuckets : skillBuckets;
      if (!targetMap.has(rel)) {
        targetMap.set(rel, { sum: 0, count: 0, total: 0, skipped: 0, aiAssisted: 0 });
      }
      const rb = targetMap.get(rel);
      rb.total++;
      if (isSkipped) rb.skipped++;
      else if (isAiAssisted) rb.aiAssisted++;
      else if (hasScore) {
        rb.sum += item.score;
        rb.count++;
      }
    }
  }

  const toAvgMap = (map) => {
    const out = {};
    for (const [k, v] of map.entries()) {
      out[k] = {
        average: v.count > 0 ? Number((v.sum / v.count).toFixed(2)) : null,
        answeredCount: v.count,
        totalCount: v.total,
        skippedCount: v.skipped,
        aiAssistedCount: v.aiAssisted,
      };
    }
    return out;
  };

  const categoryAverages = toAvgMap(catBuckets);
  const projectAverages = toAvgMap(projectBuckets);
  const skillAverages = toAvgMap(skillBuckets);

  // Strongest areas: only from categories/topics with own answered scores >= 3.5 (or highest own score)
  const scoredAreas = Object.entries(categoryAverages)
    .filter(([, v]) => v.average !== null && v.answeredCount > 0)
    .sort((a, b) => b[1].average - a[1].average);

  const strongestAreas = scoredAreas
    .filter(([, v]) => v.average >= 3.5)
    .map(([k]) => k);

  const weakestAreas = Object.entries(categoryAverages)
    .filter(([, v]) => (v.average !== null && v.average < 3.5) || v.skippedCount > 0 || v.aiAssistedCount > 0)
    .sort((a, b) => (a[1].average ?? 0) - (b[1].average ?? 0))
    .map(([k]) => k);

  const averageScore = ownScoredCount > 0 ? Number((ownScoreSum / ownScoredCount).toFixed(2)) : null;

  return {
    totalQuestions,
    answeredCount,
    skippedCount,
    aiAssistedCount,
    averageScore,
    categoryAverages,
    projectAverages,
    skillAverages,
    strongestAreas,
    weakestAreas,
  };
};

/**
 * Guards AI-generated final report output.
 * Ensures no ATS mentions, no URLs in topicsToStudy, and honest reporting of skipped/AI-assisted answers.
 */
export const guardReport = (rawReport, stats, items = []) => {
  if (!rawReport || typeof rawReport !== "object") {
    return null;
  }

  const stripLinks = (text) => String(text || "").replace(/https?:\/\/\S+/gi, "").trim();

  // Build set of topics/projects that were ONLY skipped or AI-assisted (never answered independently)
  const independentTopics = new Set();
  const nonIndependentTopics = new Set();
  for (const item of items) {
    const label = (item.relatedTo || item.category || "").toLowerCase().trim();
    if (!label) continue;
    if (!item.skipped && !item.usedAiAnswer) {
      independentTopics.add(label);
    } else {
      nonIndependentTopics.add(label);
    }
  }

  const rawStrengths = Array.isArray(rawReport.strengths) ? rawReport.strengths : [];
  const filteredStrengths = rawStrengths
    .map((s) => stripAtsReference(String(s).trim()))
    .filter(Boolean)
    .filter((s) => {
      const low = s.toLowerCase();
      // Exclude strength claims that mention AI-assisted or skipped-only topics without independent answers
      for (const topic of nonIndependentTopics) {
        if (!independentTopics.has(topic) && topic.length > 2 && low.includes(topic)) {
          return false;
        }
      }
      if (/ai-assisted|ai answer|used ai/i.test(low)) return false;
      return true;
    })
    .slice(0, 5);

  const weakAreas = Array.isArray(rawReport.weakAreas)
    ? rawReport.weakAreas
        .slice(0, 5)
        .map((w) => ({
          area: stripAtsReference(String(w?.area || "General").trim()),
          relatedTo: stripAtsReference(String(w?.relatedTo || "").trim()),
          whyItMatters: stripAtsReference(String(w?.whyItMatters || "").trim()),
          fix: stripAtsReference(String(w?.fix || "").trim()),
        }))
        .filter((w) => w.area && (w.whyItMatters || w.fix))
    : [];

  const answerHabits = Array.isArray(rawReport.answerHabits)
    ? rawReport.answerHabits.map((h) => stripAtsReference(String(h).trim())).filter(Boolean).slice(0, 6)
    : [];

  const projectReadiness = Array.isArray(rawReport.projectReadiness)
    ? rawReport.projectReadiness
        .slice(0, 8)
        .map((p) => ({
          project: stripAtsReference(String(p?.project || "").trim()),
          score: typeof p?.score === "number" ? Math.max(0, Math.min(5, p.score)) : null,
          note: stripAtsReference(String(p?.note || "").trim()),
        }))
        .filter((p) => p.project)
    : [];

  const topicsToStudy = Array.isArray(rawReport.topicsToStudy)
    ? rawReport.topicsToStudy
        .slice(0, 8)
        .map((t) => ({
          topic: stripAtsReference(stripLinks(t?.topic || "")),
          reason: stripAtsReference(stripLinks(t?.reason || "")),
          practice: stripAtsReference(stripLinks(t?.practice || "")),
        }))
        .filter((t) => t.topic)
    : [];

  const nextSteps = Array.isArray(rawReport.nextSteps)
    ? rawReport.nextSteps.map((n) => stripAtsReference(stripLinks(n))).filter(Boolean).slice(0, 5)
    : [];

  return {
    headline: stripAtsReference(String(rawReport.headline || "Practice session completed.").trim()),
    summary: stripAtsReference(String(rawReport.summary || "").trim()),
    strengths:
      stats.answeredCount > 0
        ? filteredStrengths
        : [],
    weakAreas,
    answerHabits,
    projectReadiness,
    topicsToStudy,
    nextSteps,
  };
};
