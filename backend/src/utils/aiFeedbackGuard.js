import { extractSkillsFromText } from "./skillTaxonomy.js";
import { ACTION_VERBS } from "../services/resumeScoring.service.js";

/**
 * Server-side guards ensuring AI feedback obeys score hygiene, number grounding,
 * rewrite constraints, and non-ATS terminology.
 */

export const DISALLOWED_REWRITE_IMPACT_WORDS = [
  "faster",
  "reduced",
  "reduction",
  "improved",
  "increased",
  "increasing",
  "boosting",
  "enabling",
  "enhancing",
  "streamlining",
  "achieving",
  "resulting",
];

export const ALLOWED_GRAMMAR_WORDS = new Set([
  "a", "an", "the", "and", "or", "in", "on", "at", "to", "for", "of", "with",
  "using", "by", "from", "as", "into", "across", "through", "via", "over", "is",
  "are", "was", "were", "be", "been", "being",
]);

const COMMON_TEMPLATE_WORDS = new Set([
  "what", "you", "built", "automated", "project", "name", "skill", "used", "experience",
]);

const SCORE_KEY_DISPLAY_MAP = {
  atsCompatibility: "Parsing & Layout",
  impactAchievements: "Impact & Achievements",
  skillsValidation: "Skills Validation",
  projectQuality: "Project Quality",
  writingQuality: "Writing Quality",
  professionalism: "Professionalism",
};

const PARENTHETICAL_CAMEL_SCORE_REGEX =
  /\s*\([^)]*(?:\b(?:atsCompatibility|impactAchievements|skillsValidation|projectQuality|writingQuality|professionalism|parseRate|recruiterMatch|wordCount|approxPages)\b|\b[a-z]{2,}[A-Z][a-zA-Z]*\b)[^)]*\d[^)]*\)/g;

const PARENTHETICAL_NUMBER_CAMEL_FIRST_REGEX =
  /\s*\([^)]*\d[^)]*(?:\b(?:atsCompatibility|impactAchievements|skillsValidation|projectQuality|writingQuality|professionalism|parseRate|recruiterMatch|wordCount|approxPages)\b|\b[a-z]{2,}[A-Z][a-zA-Z]*\b)[^)]*\)/g;

/**
 * Extracts numeric tokens outside square brackets `[...]` (commas normalized out).
 *
 * @param {string} text
 * @returns {string[]}
 */
export function extractUnbracketedNumbers(text) {
  if (!text || typeof text !== "string") return [];
  const withoutBrackets = text.replace(/\[[^\]]*\]/g, " ");
  const matches = withoutBrackets.match(/\d[\d,]*(?:\.\d+)?/g) || [];
  return matches.map((m) => m.replace(/,/g, ""));
}

/**
 * Checks whether candidateText contains any unbracketed number not in allowedSourceText.
 *
 * @param {string} candidateText
 * @param {string} allowedSourceText
 * @returns {boolean}
 */
export function hasDisallowedUnbracketedNumbers(candidateText, allowedSourceText) {
  const candidateNums = extractUnbracketedNumbers(candidateText);
  if (candidateNums.length === 0) return false;

  const allowedSet = new Set(extractUnbracketedNumbers(allowedSourceText));
  return candidateNums.some((num) => !allowedSet.has(num));
}

/**
 * Checks whether improved introduced bracketed placeholders [...] absent from original.
 *
 * @param {string} improved
 * @param {string} original
 * @returns {boolean}
 */
export function hasDisallowedPlaceholders(improved, original) {
  if (typeof improved !== "string") return false;
  const improvedBrackets = improved.match(/\[[^\]]*\]/g) || [];
  if (improvedBrackets.length === 0) return false;

  const originalLower = typeof original === "string" ? original.toLowerCase() : "";
  return improvedBrackets.some((token) => !originalLower.includes(token.toLowerCase()));
}

/**
 * Checks whether improved contains forbidden impact adjectives/verbs not in original.
 *
 * @param {string} improved
 * @param {string} original
 * @returns {boolean}
 */
export function hasDisallowedImpactWords(improved, original) {
  if (typeof improved !== "string") return false;
  const origStr = typeof original === "string" ? original : "";

  return DISALLOWED_REWRITE_IMPACT_WORDS.some((word) => {
    const regex = new RegExp(`\\b${word}\\b`, "i");
    return regex.test(improved) && !regex.test(origStr);
  });
}

/**
 * Checks whether improved adds any noun, adjective phrase, tool or number not present in original.
 * Allowed: tense change, merged duplicates, reordering, stronger verb, grammar prepositions/articles.
 *
 * @param {string} improved
 * @param {string} original
 * @returns {boolean}
 */
export function hasDisallowedAddedWords(improved, original) {
  if (typeof improved !== "string") return true;
  if (typeof original !== "string" || !original.trim()) return true;

  const origTokens = original.toLowerCase().match(/[a-z0-9.+#-]+/g) || [];
  const origSet = new Set(origTokens);

  const improvedTokens = improved.toLowerCase().match(/[a-z0-9.+#-]+/g) || [];
  if (improvedTokens.length === 0) return true;

  for (const token of improvedTokens) {
    if (origSet.has(token)) continue;
    if (ALLOWED_GRAMMAR_WORDS.has(token)) continue;
    if (ACTION_VERBS.has(token)) continue;

    // Check common verb tense variations (e.g. building -> built)
    const stem = token.replace(/(?:ed|ing|s)$/, "");
    if (stem.length > 2 && Array.from(origSet).some((ot) => ot.startsWith(stem))) {
      continue;
    }

    // Token is an added noun, adjective, tool or number not in original
    return true;
  }

  return false;
}

/**
 * Checks whether an example matches the standard fill-in-the-blank template or experience prefix.
 *
 * @param {string} exampleText
 * @returns {boolean}
 */
export function isTemplateExample(exampleText) {
  if (typeof exampleText !== "string") return false;
  const trimmed = exampleText.trim();
  const templateRegex =
    /^<?[A-Za-z0-9.+#\s/-]+>?\s*[-–—]\s*used\s+for\s+\[what\s+you\s+built\s+or\s+automated\]\s+in\s+\[project\s+name\]\s*$/i;
  if (templateRegex.test(trimmed)) return true;
  if (/^if\s+you\s+have\s+experience\s+with\b/i.test(trimmed)) return true;
  return false;
}

/**
 * Checks whether an example is factually grounded in the resume or a valid template.
 * If ungrounded facts or skills outside the resume are found, returns empty string.
 *
 * @param {string} rawExample
 * @param {string} redactedResumeText
 * @param {Set<string>} detectedSkillsSet
 * @returns {string}
 */
export function validateSuggestionExample(rawExample, redactedResumeText, detectedSkillsSet) {
  if (!rawExample || typeof rawExample !== "string") return "";
  const cleaned = cleanAiTextHygiene(rawExample);
  if (!cleaned) return "";

  if (hasDisallowedUnbracketedNumbers(cleaned, redactedResumeText)) {
    return "";
  }

  if (isTemplateExample(cleaned)) {
    return cleaned;
  }

  // Extract skills from example using skill taxonomy
  const exampleSkills = extractSkillsFromText(cleaned);
  const hasUndetectedSkill = exampleSkills.some(
    (sk) => !detectedSkillsSet.has(sk.toLowerCase())
  );
  if (hasUndetectedSkill) {
    // If a skill is not in the resume's detected skills and example is not template, BLANK it
    return "";
  }

  // Check for invented tools/projects/databases/actions outside brackets
  const textWithoutBrackets = cleaned.replace(/\[[^\]]*\]/g, " ");
  const contentWords = (textWithoutBrackets.toLowerCase().match(/[a-z]{4,}/g) || []).filter(
    (w) =>
      !ALLOWED_GRAMMAR_WORDS.has(w) &&
      !ACTION_VERBS.has(w) &&
      !COMMON_TEMPLATE_WORDS.has(w)
  );
  const resumeLower = (redactedResumeText || "").toLowerCase();
  const ungroundedWords = contentWords.filter((w) => !resumeLower.includes(w));
  if (ungroundedWords.length >= 2) {
    return "";
  }

  return cleaned;
}

/**
 * Merges exact duplicate sentences within a rewritten bullet so repeated sentences appear once.
 *
 * @param {string} text
 * @returns {string}
 */
export function deduplicateRepeatedSentences(text) {
  if (!text || typeof text !== "string") return "";
  const trimmed = text.trim();
  const sentences = trimmed
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (sentences.length <= 1) return trimmed;

  const seen = new Set();
  const unique = [];
  for (const sentence of sentences) {
    const norm = sentence.toLowerCase().replace(/[.!?\s]+$/g, "").replace(/\s+/g, " ").trim();
    if (!seen.has(norm)) {
      seen.add(norm);
      unique.push(sentence);
    }
  }

  return unique.join(" ");
}

/**
 * Cleans internal score keys, parenthetical raw scores, and "ATS" mentions from AI output text.
 *
 * @param {string} text
 * @returns {string}
 */
export function cleanAiTextHygiene(text) {
  if (typeof text !== "string") return "";

  let cleaned = text
    .replace(PARENTHETICAL_CAMEL_SCORE_REGEX, "")
    .replace(PARENTHETICAL_NUMBER_CAMEL_FIRST_REGEX, "");

  for (const [key, displayName] of Object.entries(SCORE_KEY_DISPLAY_MAP)) {
    const flag = key === "professionalism" ? "g" : "gi";
    const keyRegex = new RegExp(`\`?\\b${key}\\b\`?`, flag);
    cleaned = cleaned.replace(keyRegex, displayName);
  }

  cleaned = cleaned.replace(/\bats\b/gi, "automated screening");

  return cleaned
    .replace(/ {2,}/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .trim();
}

/**
 * Filters AI bulletRewrites and suggestion examples against fabricated numbers,
 * placeholders/impact words inside "improved", internal key leakage, and "ATS" wording.
 *
 * @param {Object} generated Validated AI feedback payload
 * @param {string} redactedResumeText Redacted resume text passed to AI
 * @param {Object} context Optional context containing detectedSkills, targetSkills, candidateProfileSkills
 * @returns {{ summary: string, strengths: string[], improvements: string[], suggestions: Array, bulletRewrites: Array }}
 */
export function sanitizeAiFeedback(generated, redactedResumeText, context = {}) {
  const detectedSkills = context.detectedSkills
    ? Array.from(context.detectedSkills).map((s) => s.toLowerCase())
    : extractSkillsFromText(redactedResumeText || "").map((s) => s.toLowerCase());
  const detectedSkillsSet = new Set(detectedSkills);

  const allowedSkillsList = [
    ...(context.targetSkills || []),
    ...(context.candidateProfileSkills || []),
    ...detectedSkills,
  ].map((s) => s.toLowerCase());
  const allowedSkillsSet = new Set(allowedSkillsList);

  const rawRewrites = Array.isArray(generated?.bulletRewrites)
    ? generated.bulletRewrites
    : [];

  const bulletRewrites = rawRewrites
    .filter((rw) => {
      const original = typeof rw?.original === "string" ? rw.original.trim() : "";
      const improved = typeof rw?.improved === "string" ? rw.improved.trim() : "";
      if (!original || !improved) return false;
      if (hasDisallowedUnbracketedNumbers(improved, original)) return false;
      if (hasDisallowedPlaceholders(improved, original)) return false;
      if (hasDisallowedImpactWords(improved, original)) return false;
      if (hasDisallowedAddedWords(improved, original)) return false;
      return true;
    })
    .slice(0, 3)
    .map((rw) => ({
      original: cleanAiTextHygiene(rw.original.trim()),
      improved: cleanAiTextHygiene(deduplicateRepeatedSentences(rw.improved)),
      reason: cleanAiTextHygiene(typeof rw.reason === "string" ? rw.reason : ""),
      metricHint: cleanAiTextHygiene(typeof rw.metricHint === "string" ? rw.metricHint : ""),
    }));

  const rawSuggestions = Array.isArray(generated?.suggestions)
    ? generated.suggestions
    : [];

  const suggestions = rawSuggestions
    .filter((s) => {
      // Never show a suggestion for a skill outside target/profile
      const titleDesc = `${s?.title || ""} ${s?.description || ""}`;
      const skillsInSugg = extractSkillsFromText(titleDesc);
      if (
        skillsInSugg.length > 0 &&
        ((context.targetSkills && context.targetSkills.length > 0) ||
          (context.candidateProfileSkills && context.candidateProfileSkills.length > 0))
      ) {
        const hasAllowedSkill = skillsInSugg.some((sk) => allowedSkillsSet.has(sk.toLowerCase()));
        if (!hasAllowedSkill) return false;
      }
      return true;
    })
    .map((s) => {
      const rawExample = typeof s?.example === "string" ? s.example : "";
      const safeExample = validateSuggestionExample(
        rawExample,
        redactedResumeText,
        detectedSkillsSet
      );

      return {
        priority: s?.priority || "medium",
        title: cleanAiTextHygiene(s?.title || ""),
        description: cleanAiTextHygiene(s?.description || ""),
        example: safeExample,
      };
    });

  return {
    summary: cleanAiTextHygiene(generated?.summary || ""),
    strengths: Array.isArray(generated?.strengths)
      ? generated.strengths.map((item) => cleanAiTextHygiene(item)).filter(Boolean)
      : [],
    improvements: Array.isArray(generated?.improvements)
      ? generated.improvements.map((item) => cleanAiTextHygiene(item)).filter(Boolean)
      : [],
    suggestions,
    bulletRewrites,
  };
}
