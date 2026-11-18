import { extractSkillsFromText, normalizeSkill } from "./skillTaxonomy.js";
import { extractUnbracketedNumbers } from "./aiFeedbackGuard.js";

/**
 * Splits text into sentences while preserving structure.
 */
function splitIntoSentences(text) {
  if (!text || typeof text !== "string") return [];
  // Split on sentence boundaries: period, exclamation, question mark followed by space or newline
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Counts words in a string.
 */
export function countWords(text) {
  if (!text || typeof text !== "string") return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Server-side guard after AI response for candidate cover letters.
 * 
 * Rules:
 * 1. Drop or blank any sentence containing an unbracketed number not in resume text.
 * 2. Remove any skill from usedSkills not in detectedSkills.
 * 3. Remove/replace any tool or technology in body not in detectedSkills.
 * 4. Strip the word "ATS".
 * 5. Limit length to 260 words.
 * 6. If guard removes >30% of the body words, return aiAvailable: false.
 *
 * @param {Object} letter - { subject: string, body: string, usedSkills: string[] }
 * @param {string} resumeText - Raw or redacted resume text
 * @param {Object} options
 * @param {string[]} [options.detectedSkills=[]] - Skills detected in candidate resume
 * @returns {{ aiAvailable: boolean, message?: string, coverLetter?: { subject: string, body: string, usedSkills: string[] } }}
 */
export function guardCoverLetter(
  { subject = "", body = "", usedSkills = [] } = {},
  resumeText = "",
  { detectedSkills = [] } = {}
) {
  if (!body || typeof body !== "string") {
    return {
      aiAvailable: false,
      message: "AI did not generate a cover letter body.",
    };
  }

  const originalWordCount = countWords(body);
  if (originalWordCount === 0) {
    return {
      aiAvailable: false,
      message: "Generated cover letter body is empty.",
    };
  }

  // 1. Allowed numbers from resume text
  const allowedNumbersSet = new Set(extractUnbracketedNumbers(resumeText || ""));

  // 2. Canonical detected skills set
  const canonicalDetectedSet = new Set(
    (detectedSkills || [])
      .map((s) => normalizeSkill(s)?.toLowerCase())
      .filter(Boolean)
  );

  // 3. Clean subject line
  let guardedSubject = String(subject || "").replace(/\bATS\b/gi, "").trim();

  // 4. Filter sentences for ungrounded numbers
  const rawSentences = splitIntoSentences(body);
  const validSentences = [];

  for (const sentence of rawSentences) {
    const unbracketedNums = extractUnbracketedNumbers(sentence);
    const hasInventedNumber = unbracketedNums.some(
      (num) => !allowedNumbersSet.has(num)
    );

    if (hasInventedNumber) {
      // Sentence has a number not present in resume and not inside brackets -> drop sentence
      continue;
    }
    validSentences.push(sentence);
  }

  let guardedBody = validSentences.join(" ");

  // 5. Remove any tool or technology in the body that is not in detectedSkills
  // Extract skills/tools mentioned in the guarded body
  const bodySkills = extractSkillsFromText(guardedBody);
  for (const skill of bodySkills) {
    const canonical = normalizeSkill(skill);
    if (canonical && !canonicalDetectedSet.has(canonical.toLowerCase())) {
      // Tool/tech not detected in resume: remove tool or replace with [relevant skill]
      const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`\\b${escaped}\\b`, "gi");
      guardedBody = guardedBody.replace(regex, "[relevant skill]");
    }
  }

  // 6. Strip the word "ATS" (case-insensitive)
  guardedBody = guardedBody.replace(/\bATS\b/gi, "").replace(/\s{2,}/g, " ");

  // 7. Filter usedSkills: remove any skill not in detectedSkills
  const guardedUsedSkills = (Array.isArray(usedSkills) ? usedSkills : [])
    .filter((s) => {
      const canonical = normalizeSkill(s);
      return canonical && canonicalDetectedSet.has(canonical.toLowerCase());
    })
    .map((s) => normalizeSkill(s) || s);

  // 8. Word limit: max 260 words
  const words = guardedBody.trim().split(/\s+/).filter(Boolean);
  if (words.length > 260) {
    // Truncate at sentence boundary if possible
    const truncatedSentences = [];
    let currentCount = 0;
    for (const sent of splitIntoSentences(guardedBody)) {
      const sentWords = countWords(sent);
      if (currentCount + sentWords <= 260) {
        truncatedSentences.push(sent);
        currentCount += sentWords;
      } else {
        break;
      }
    }
    guardedBody = truncatedSentences.length > 0
      ? truncatedSentences.join(" ")
      : words.slice(0, 260).join(" ") + ".";
  }

  // 9. Guard drop ratio check: if > 30% of words were removed, fail safely
  const guardedWordCount = countWords(guardedBody);
  const dropRatio = (originalWordCount - guardedWordCount) / originalWordCount;

  if (dropRatio > 0.3 || guardedWordCount < 30) {
    return {
      aiAvailable: false,
      message:
        "The generated draft contained unverified claims and did not meet factual grounding standards. Please try again or add relevant skills to your profile.",
    };
  }

  return {
    aiAvailable: true,
    coverLetter: {
      subject: guardedSubject || "Application for Position",
      body: guardedBody.trim(),
      usedSkills: Array.from(new Set(guardedUsedSkills)),
    },
  };
}
