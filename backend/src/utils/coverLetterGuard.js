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
 * Server-side guard after AI response for candidate cover letters and application notes.
 * 
 * Rules:
 * 1. Drop or blank any sentence containing an unbracketed number not in resume text.
 * 2. Remove any skill from usedSkills not in detectedSkills.
 * 3. Remove/replace any tool or technology in body not in detectedSkills.
 * 4. Strip the word "ATS".
 * 5. Limit length: 260 words for "letter", or maxChars (default 950 chars, safety margin under 1000) for "note" cut at the last full sentence that fits.
 * 6. If guard removes >30% of the body words, return aiAvailable: false.
 *
 * @param {Object} letter - { subject: string, body: string, usedSkills: string[] }
 * @param {string} resumeText - Raw or redacted resume text
 * @param {Object} options
 * @param {string[]} [options.detectedSkills=[]] - Skills detected in candidate resume
 * @param {"letter"|"note"} [options.format="letter"] - Generation format
 * @param {number} [options.maxChars=950] - Max character length for note mode (safety margin for 1000 char limit)
 * @returns {{ aiAvailable: boolean, message?: string, coverLetter?: { subject: string, body: string, usedSkills: string[] } }}
 */
export function guardCoverLetter(
  { subject = "", body = "", usedSkills = [] } = {},
  resumeText = "",
  { detectedSkills = [], format = "letter", maxChars = 950 } = {}
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

  // 3. Clean subject line (for note format, subject is empty)
  let guardedSubject =
    format === "note"
      ? ""
      : String(subject || "").replace(/\bATS\b/gi, "").trim();

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

  // 7. Filter usedSkills: remove any skill not in detectedSkills while preserving verified skills
  const guardedUsedSkills = (Array.isArray(usedSkills) ? usedSkills : [])
    .filter((s) => {
      if (!s || typeof s !== "string") return false;
      const sLower = s.trim().toLowerCase();
      const sCanon = normalizeSkill(s)?.toLowerCase();
      return (detectedSkills || []).some((d) => {
        const dLower = d.trim().toLowerCase();
        const dCanon = normalizeSkill(d)?.toLowerCase();
        return sLower === dLower || (sCanon && dCanon && sCanon === dCanon);
      });
    });

  // 8. Factual grounding drop ratio check (BEFORE length/formatting truncation):
  const factualWordCount = countWords(guardedBody);
  const factualDropRatio = (originalWordCount - factualWordCount) / originalWordCount;
  // If >50% of short test text (<50 words) is dropped, or >30% of full text (>=50 words) is dropped
  const isExcessiveDrop = originalWordCount >= 50 ? factualDropRatio > 0.30 : factualDropRatio > 0.50;

  if (isExcessiveDrop || factualWordCount < 5) {
    return {
      aiAvailable: false,
      message:
        "The generated draft contained unverified claims and did not meet factual grounding standards. Please try again or add relevant skills to your profile.",
    };
  }

  // 9. Length limit & formatting:
  if (format === "note") {
    // Note format: must never exceed the real max length of coverNote (1000 chars, safety margin maxChars e.g. 950)
    // Cut at the last full sentence that fits
    if (guardedBody.length > maxChars) {
      const noteSentences = splitIntoSentences(guardedBody);
      const fittingSentences = [];
      let currentLength = 0;
      for (const sent of noteSentences) {
        const addedLen = fittingSentences.length > 0 ? sent.length + 1 : sent.length;
        if (currentLength + addedLen <= maxChars) {
          fittingSentences.push(sent);
          currentLength += addedLen;
        } else {
          break;
        }
      }
      guardedBody = fittingSentences.length > 0
        ? fittingSentences.join(" ")
        : guardedBody.slice(0, maxChars).trim();
    }
  } else {
    // Letter format: max 260 words
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
  }

  return {
    aiAvailable: true,
    coverLetter: {
      subject: guardedSubject,
      body: guardedBody.trim(),
      usedSkills: Array.from(new Set(guardedUsedSkills)),
    },
  };
}
