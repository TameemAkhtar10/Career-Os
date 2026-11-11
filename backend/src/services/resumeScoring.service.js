import crypto from "crypto";
import { extractSkillsFromText, compareSkills } from "../utils/skillTaxonomy.js";
import { redactResumeText } from "../utils/redact.js";

/**
 * Calibration rubric configuration for deterministic resume scoring.
 * Tune thresholds and weights here without touching scoring logic.
 */
export const SCORING_RUBRIC = {
  SCORING_VERSION: "2.2.0",
  AI_PROMPT_VERSION: "2.2.0",
  weights: {
    atsCompatibility: 0.25,
    impactAchievements: 0.20,
    skillsValidation: 0.20,
    projectQuality: 0.15,
    writingQuality: 0.10,
    professionalism: 0.10,
  },
  impact: {
    metricWeight: 0.60,
    actionVerbWeight: 0.40,
    // [share, points] piecewise linear breakpoints: 0%=0, 25%=40, 50%=70, 75%+=100
    shareCurve: [
      [0, 0],
      [0.25, 40],
      [0.50, 70],
      [0.75, 100],
    ],
  },
  projectQuality: {
    maxProjects: 8,
    minProjectsForFull: 2,
    projectCountPoints: 30,
    minAvgBulletsForFull: 3,
    avgBulletsPoints: 20,
    techStackPoints: 20,
    linkPoints: 15,
    minMetricShareForFull: 0.5,
    metricsPoints: 15,
  },
  writingQuality: {
    baseScore: 100,
    noBulletsScore: 0,
    minWords: 8,
    maxWords: 25,
    outsideWordRangePenalty: 6,
    weakPhrasePenalty: 10,
    firstPersonPenalty: 10,
    repeatedOpenerThreshold: 3,
    repeatedOpenerPenalty: 10,
  },
  skillsValidation: {
    backedInProjectsExpPoints: 60,
    skillsSectionPresentPoints: 10,
    groupedCategoriesFullThreshold: 2,
    groupedCategoriesPoints: 10,
    minRecognizedSkillsForFull: 5,
    recognizedOrTargetPoints: 20,
  },
  parsingLayout: {
    baseScore: 100,
    minReadableWords: 15,
    sparseWordsThreshold: 100,
    sparseWordsPenalty: 15,
    missingCoreHeadingPenalty: 10,
    missingExperienceHeadingPenalty: 5,
    tableOrColumnsPenalty: 20,
    maxPages: 2,
    maxWords: 700,
    minWordsPerPageForLengthPenalty: 250,
    sparsePageWordsPerPageThreshold: 150,
    overLengthPenalty: 15,
    maxFileSizeBytes: 2 * 1024 * 1024,
    oversizeFilePenalty: 10,
    oddCharactersPenalty: 10,
  },
  professionalism: {
    emailPoints: 15,
    phonePoints: 15,
    socialLinkPoints: 10,
    dateConsistencyFullPoints: 10,
    dateConsistencyPartialPoints: 5,
    bulletConsistencyFullPoints: 10,
    bulletConsistencyPartialPoints: 4,
    noEmojiPoints: 10,
    noFutureDatesPoints: 20,
    fresherMaxPages: 1,
    onePageFullPoints: 10,
    twoPagePartialPoints: 5,
  },
  caps: {
    maxWithoutAllSubScores85: 92,
    requiredSubScoreForTopBand: 85,
    maxIfImpactBelow30: 70,
    lowImpactThreshold: 30,
    maxIfFutureDates: 75,
  },
  gradeBands: [
    { min: 90, grade: "A+" },
    { min: 85, grade: "A" },
    { min: 80, grade: "A-" },
    { min: 75, grade: "B+" },
    { min: 70, grade: "B" },
    { min: 65, grade: "B-" },
    { min: 60, grade: "C+" },
    { min: 50, grade: "C" },
    { min: 40, grade: "D" },
    { min: 0, grade: "F" },
  ],
};

/**
 * Computes deterministic analysis cacheKey incorporating scoring and prompt versions.
 */
export function computeResumeCacheKey({
  contentHash,
  targetType = "none",
  targetIdentifier = "none",
  scoringVersion = SCORING_RUBRIC.SCORING_VERSION,
  aiPromptVersion = SCORING_RUBRIC.AI_PROMPT_VERSION,
}) {
  const parts = `${contentHash}:${targetType}:${targetIdentifier}:${scoringVersion}:${aiPromptVersion}`;
  return crypto.createHash("sha256").update(parts).digest("hex");
}

/**
 * Curated list of strong action verbs for impact analysis
 */
export const ACTION_VERBS = new Set([
  "accelerated", "accelerate", "accomplished", "accomplish", "achieved", "achieve",
  "administered", "advanced", "advised", "analyzed", "analyze", "architected", "architect",
  "authored", "automated", "automate", "benchmarked", "boosted", "boost", "built", "build",
  "cached", "centralized", "championed", "collaborated", "collaborate", "compiled",
  "composed", "configured", "configure", "constructed", "construct", "containerized",
  "contributed", "converted", "coordinated", "coordinate", "crafted", "created", "create",
  "customized", "debugged", "debug", "decreased", "decrease", "delivered", "deliver",
  "deployed", "deploy", "designed", "design", "developed", "develop", "diagnosed",
  "directed", "documented", "drafted", "eliminated", "eliminate", "enabled", "enable",
  "engineered", "engineer", "enhanced", "enhance", "established", "evaluated", "executed",
  "execute", "expanded", "expedited", "fabricated", "facilitated", "formulated", "founded",
  "generated", "generate", "guided", "hardened", "hosted", "implemented", "implement",
  "improved", "improve", "increased", "increase", "indexed", "initiated", "innovated",
  "inspected", "installed", "instituted", "instrumented", "integrated", "integrate",
  "invented", "investigated", "launched", "launch", "lead", "led", "leveraged",
  "maintained", "maintain", "managed", "manage", "maximized", "maximize", "mentored",
  "migrated", "migrate", "minimized", "minimize", "modeled", "modernized", "monitored",
  "monitor", "negotiated", "optimized", "optimize", "orchestrated", "organized",
  "overhauled", "parsed", "performed", "pioneered", "planned", "prepared", "produced",
  "profiled", "programmed", "provisioned", "published", "re-engineered", "rebuilt",
  "reduced", "reduce", "refactored", "refactor", "remodeled", "reorganized", "resolved",
  "resolve", "restructured", "revamped", "reviewed", "rewrote", "scaled", "scale",
  "scheduled", "secured", "secure", "simplified", "simplify", "solved", "spearheaded",
  "standardized", "streamlined", "streamline", "strengthened", "supervised",
  "systematized", "tested", "test", "tracked", "trained", "transformed", "upgraded",
  "validated", "visualized", "wrote",
]);

/**
 * Weak passive phrases to flag in writing quality
 */
export const WEAK_PHRASES = [
  "responsible for",
  "worked on",
  "helped with",
  "helped",
  "assisted in",
  "assisted with",
  "assisted",
  "tasked with",
  "handled",
  "duties included",
  "involved in",
  "part of a team that",
];

const WEAK_PHRASE_REGEX =
  /\b(?:responsible\s+for|worked\s+on|helped(?:\s+with)?|assisted(?:\s+(?:in|with))?|tasked\s+with|duties\s+included|part\s+of\s+a\s+team\s+that)\b/gi;
const WEAK_PHRASE_START_REGEX =
  /^(?:responsible\s+for|worked\s+on|helped|assisted|tasked\s+with|duties\s+included|part\s+of\s+a\s+team\s+that)\b/i;
const FIRST_PERSON_REGEX = /(?<![\/-])\b(?:i|me|my|mine|we|our|ours)\b(?![\/.-])/gi;

/**
 * Returns current date in Asia/Kolkata timezone
 */
export function getCurrentISTDate() {
  const now = new Date();
  const istFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });
  const parts = istFormatter.formatToParts(now);
  const partMap = {};
  for (const p of parts) partMap[p.type] = p.value;

  return new Date(
    parseInt(partMap.year, 10),
    parseInt(partMap.month, 10) - 1,
    parseInt(partMap.day, 10)
  );
}

const ZERO_WIDTH_CHAR_REGEX = /[\u200B-\u200D\uFEFF]/g;
const LEADING_TRAILING_DECOR_REGEX =
  /^[\uE000-\uF8FF\u2022-\u25FF\u2600-\u27BF\uFE0F\u200B-\u200D\uFEFF•▪●\s]+|[\uE000-\uF8FF\u2022-\u25FF\u2600-\u27BF\uFE0F\u200B-\u200D\uFEFF•▪●\s]+$/gu;

const UNICODE_BULLET_GLYPHS =
  /^(?:[\uE000-\uF8FF\u2022-\u25FF\u2600-\u27BF•▪●◦‣⁃∙➢➤▸▹◆◇■□]\uFE0F?)\s*/u;
const DASH_BULLET_PREFIX = /^[\-–—]\s+/u;
const ASTERISK_BULLET_PREFIX = /^\*\s+/u;
const NUMBERED_BULLET_PREFIX = /^\d{1,2}[.)]\s+/u;
const ASCII_BULLET_PREFIX = /^(?:[\-–—*]|\d{1,2}[.)])\s+/u;

const COLON_METADATA_LINE_REGEX =
  /^(?:tech(?:nologies)?\s*stack|tools(?:\s*used)?|built\s*with|stack|skills|environment|github|live\s*demo|demo|repo(?:sitory)?|link|url)\s*:/i;
const STACK_LIST_WITHOUT_COLON_REGEX =
  /^(?:tech(?:nologies)?\s*stack|built\s*with|tools(?:\s*used)?)\s+[A-Za-z0-9.+#-]+(?:\s*,\s*[A-Za-z0-9.+#-]+)*/i;
const DATE_RANGE_SUFFIX_REGEX =
  /(?:\((?:19|20)\d{2}|\b(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\.?\s+(?:19|20)\d{2}\s*[-–—]\s*(?:present|current|ongoing|now|(?:[a-z]+\s+)?(?:19|20)\d{2})|\d{1,2}\/(?:19|20)\d{2}\s*[-–—]\s*(?:present|current|ongoing|now|(?:[a-z]+\s+|\d{1,2}\/)?(?:19|20)\d{2})|\b(?:19|20)\d{2}\s*[-–—]\s*(?:(?:19|20)\d{2}|present|current|ongoing|now))\s*\)?$/i;

const PROJECT_URL_PATTERN_REGEX =
  /(?:https?:\/\/|https?:|www\.\S+|(?:github|gitlab)\.com|(?:vercel|netlify)\.app|render\.com|herokuapp\.com|[a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?:dev|io)\b)/i;
const PROJECT_LINK_LABEL_REGEX =
  /\b(?:live\s+demo|live|demo|github|source|code|repo|link|website)\b/i;
const LINK_ONLY_TOKEN_REGEX =
  /^(?:live|demo|github|gitlab|source|code|repo|repository|link|website|portfolio)$/i;

const SKILL_CATEGORY_LINE_REGEX = /^[A-Za-z][A-Za-z0-9\s&/+.-]{1,35}:\s*\S+/;

// Count ONLY U+FFFD and control characters (exclude \n=0x0A, \t=0x09, \r=0x0D)
// Private-use (U+E000-U+F8FF), icon-font/dingbats (U+2022-U+25FF, U+2600-U+27BF), zero-width are NEVER corrupted
export const CONTROL_CHAR_REGEX = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g;
export const REPLACEMENT_CHAR_REGEX = /\uFFFD/g;
export const CORRUPTED_CHAR_REGEX = /[\uFFFD\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g;
export const PRIVATE_USE_GLYPHS_REGEX = /[\uE000-\uF8FF\u2022-\u25FF\u2600-\u27BF\uFE0F]/gu;

export const DEGREE_EVIDENCE_REGEX =
  /\b(?:b\.?tech|b\.?e\.?|bca|mca|b\.?sc|m\.?sc|bachelor(?:'s)?|master(?:'s)?|diploma|university|college|10th|12th|hsc|ssc)\b/i;

const ODD_CHAR_REGEX = CORRUPTED_CHAR_REGEX;
const EMOJI_REGEX =
  /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}]/u;

// Regex matching percentages, multipliers (x), k+/M+/B+, currency, latency/time/data units, and quantified scale
const METRIC_REGEX =
  /(?:\b\d+(?:\.\d+)?\s*%|\b\d+(?:\.\d+)?\s*x(?=\s|$|[,.;:)])|\b\d+(?:\.\d+)?[kKmMbB]?\+(?=\s|$|[,.;:)])|\b\d+(?:\.\d+)?\s*[kKmMbB](?=\s|$|[,.;:)+])|(?:₹|\$|\b(?:inr|usd|eur))\s*[\d,]+(?:\.\d+)?\s*[kKmMbB]?\+?|\b\d+(?:\.\d+)?\s*(?:ms|milliseconds?|sec(?:onds?)?|mins?|minutes?|hrs?|hours?|days?|weeks?|months?|fps|kb|mb|gb|tb|rps|qps|req\/s|ops\/s|mbps|kbps)\b|(?!(?:19|20)\d{2}s\b)\b\d+(?:\.\d+)?s\b|\b(?:(?:19|20)\d{2}\+|(?!(?:19|20)\d{2}\b)[\d,]+\+?)\s*(?:[a-z]+\s+){0,2}(?:users?|dau|mau|clients?|customers?|subscribers?|visitors?|followers?|members?|students?|participants?|candidates?|applicants?|recruiters?|companies|teams?|engineers?|developers?|requests?|queries|transactions?|events?|messages?|emails?|notifications?|records?|rows?|documents?|files?|pages?|screens?|components?|endpoints?|apis?|routes?|microservices?|services?|modules?|features?|projects?|tasks?|tickets?|bugs?|issues?|errors?|downloads?|installs?|stars?|forks?|commits?|prs?|pull\s+requests?|test\s+cases?|unit\s+tests?|tests?|assertions?|lines?|languages?|sessions?)\b|\b(?:top\s+\d+|#\d+|(?!(?:19|20)\d{2}\b)\d+(?:\.\d+)?\s*\/\s*(?:10|20|50|100))\b|\bfrom\s+(?!(?:19|20)\d{2}\b)[\d,]+%?\s+to\s+(?!(?:19|20)\d{2}\b)[\d,]+%?\b)/i;

function detectBulletStyle(line) {
  if (UNICODE_BULLET_GLYPHS.test(line)) return "unicode";
  if (DASH_BULLET_PREFIX.test(line)) return "dash";
  if (ASTERISK_BULLET_PREFIX.test(line)) return "asterisk";
  if (NUMBERED_BULLET_PREFIX.test(line)) return "numbered";
  return "plain";
}

function hasBulletGlyphPrefix(line) {
  return UNICODE_BULLET_GLYPHS.test(line) || ASCII_BULLET_PREFIX.test(line);
}

function stripBulletGlyphPrefix(line) {
  if (UNICODE_BULLET_GLYPHS.test(line)) {
    return line.replace(UNICODE_BULLET_GLYPHS, "").trim();
  }
  if (ASCII_BULLET_PREFIX.test(line)) {
    return line.replace(ASCII_BULLET_PREFIX, "").trim();
  }
  return line.trim();
}

function detectTableOrMultiColumnText(text) {
  if (!text || typeof text !== "string") return false;
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return false;
  let columnLines = 0;
  for (const line of lines) {
    if (/\t/.test(line) || /[^\s]\s{4,}[^\s]/.test(line)) {
      columnLines++;
    }
  }
  return columnLines >= 6 && columnLines / lines.length > 0.15;
}

/**
 * Piecewise linear interpolation along breakpoints [[x0, y0], [x1, y1], ...].
 */
function interpolateCurve(value, curve) {
  if (!Array.isArray(curve) || curve.length === 0) return 0;
  if (value <= curve[0][0]) return curve[0][1];
  for (let i = 1; i < curve.length; i++) {
    const [x0, y0] = curve[i - 1];
    const [x1, y1] = curve[i];
    if (value <= x1) {
      const span = x1 - x0;
      if (span <= 0) return y1;
      return y0 + ((value - x0) / span) * (y1 - y0);
    }
  }
  return curve[curve.length - 1][1];
}

/**
 * Checks whether a text block contains visible URLs or standalone project link labels.
 */
function hasProjectLinkSignal(text) {
  if (!text || typeof text !== "string") return false;
  return PROJECT_URL_PATTERN_REGEX.test(text) || PROJECT_LINK_LABEL_REGEX.test(text);
}

/**
 * Checks whether a line is a Tech Stack / Built with / link-field metadata sub-line.
 */
function isMetadataOrStackLine(line) {
  if (!line) return false;
  if (COLON_METADATA_LINE_REGEX.test(line)) return true;
  if (
    STACK_LIST_WITHOUT_COLON_REGEX.test(line) &&
    !/[.!?]$/.test(line) &&
    !/\b(?:for|to|serving|that|which|helping)\b/i.test(line)
  ) {
    const wordsCount = line.split(/\s+/).filter(Boolean).length;
    return wordsCount <= 10;
  }
  return false;
}

/**
 * Checks whether a line consists solely of URLs and/or clickable link label tokens (e.g. "Live | GitHub").
 */
function isLinkOnlyMetadataLine(line) {
  if (!line || typeof line !== "string") return false;
  const cleaned = line
    .replace(ZERO_WIDTH_CHAR_REGEX, "")
    .replace(LEADING_TRAILING_DECOR_REGEX, "")
    .trim();
  if (!cleaned) return false;

  const tokens = cleaned
    .split(/[\s|,/;•()[\]]+/)
    .map((t) => t.replace(/^[:\-–—]+|[:\-–—]+$/g, "").trim())
    .filter(Boolean);

  if (tokens.length === 0 || tokens.length > 8) return false;

  return tokens.every(
    (tok) => LINK_ONLY_TOKEN_REGEX.test(tok) || PROJECT_URL_PATTERN_REGEX.test(tok)
  );
}

/**
 * Identifies standard resume section headings after stripping icon-font and bullet glyphs.
 * Returns: { section: "summary" | "skills" | "projects" | "experience" | "education" | "certifications", remainder: string } | null
 */
export function detectSectionHeadingWithRemainder(line) {
  if (!line || typeof line !== "string") return null;
  const trimmed = line.replace(ZERO_WIDTH_CHAR_REGEX, "").trim();
  if (!trimmed) return null;

  // Ignore lines ending with sentence punctuation unless it is a trailing colon/dash
  if (/[;!?]$/.test(trimmed)) return null;

  // Strip leading and trailing icon-font / decorative glyphs
  const withoutDecor = trimmed.replace(LEADING_TRAILING_DECOR_REGEX, "").trim();
  if (!withoutDecor) return null;

  // Check for inline colon e.g. "Education: B.Tech in Computer Science"
  let candidateTitle = withoutDecor;
  let remainder = "";
  const colonIdx = withoutDecor.indexOf(":");
  if (colonIdx > 0 && colonIdx < 45) {
    candidateTitle = withoutDecor.slice(0, colonIdx).trim();
    remainder = withoutDecor.slice(colonIdx + 1).trim();
  }

  // Collapse single-letter spacing e.g. "E D U C A T I O N" -> "EDUCATION"
  if (/^[A-Za-z](?:\s+[A-Za-z])+$/.test(candidateTitle)) {
    candidateTitle = candidateTitle.replace(/\s+/g, "");
  }

  const cleaned = candidateTitle
    .replace(/^(?:\d+|[ivxIVX]+)[.)]\s*/, "")
    .replace(/^[:\-—_|*\s]+|[:\-—_|*\s]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned || cleaned.length > 50) return null;
  const words = cleaned.split(/\s+/);
  if (words.length > 5) return null;

  if (/^(?:(?:professional|career|executive)\s+)?(?:summary|profile|objective|about(?:\s+me)?|overview)$/i.test(cleaned)) {
    return { section: "summary", remainder };
  }
  if (/^(?:(?:technical|core|key|programming)\s+)?(?:skills?|technologies|tech\s+stack|tools(?:\s*(?:&|and|\/)\s*technologies)?|competencies)(?:\s*(?:&|and|\/)\s*(?:tools|technologies))?$/i.test(cleaned)) {
    return { section: "skills", remainder };
  }
  if (/^(?:(?:personal|academic|key|major|selected|technical|notable|featured|college)\s+)?projects?(?:\s*(?:&|and|\/)\s*(?:work|experience))?$/i.test(cleaned)) {
    return { section: "projects", remainder };
  }
  if (
    /^(?:(?:work|professional|industry|relevant|internship)\s+)?(?:experience|internships?|work\s+history|employment(?:\s+history)?|career\s+history)(?:\s*(?:&|and|\/)\s*(?:experience|internships?|training|projects?))?$/i.test(cleaned) ||
    /^internships?(?:\s*(?:&|and|\/)\s*(?:experience|training))?$/i.test(cleaned)
  ) {
    return { section: "experience", remainder };
  }
  if (
    /^(?:education(?:al)?(?:\s+(?:background|qualifications?|details))?|academics?|academic\s+(?:background|qualifications?|details)|qualifications?|educational\s+qualifications?)$/i.test(
      cleaned
    )
  ) {
    return { section: "education", remainder };
  }
  if (
    /^(?:(?:licenses?|courses?|awards?|honors?|achievements?)\s*(?:&|and|\/)\s*)?(?:certifications?|certificates?)(?:\s*(?:&|and|\/)\s*(?:licenses?|courses?|awards?|achievements?|training))?$/i.test(cleaned) ||
    /^(?:achievements?|awards?|honors?|publications?|licenses?)$/i.test(cleaned)
  ) {
    return { section: "certifications", remainder };
  }

  return null;
}

/**
 * Identifies standard resume section headings after stripping icon-font and bullet glyphs.
 * Returns: "summary" | "skills" | "projects" | "experience" | "education" | "certifications" | null
 */
export function detectSectionHeading(line) {
  const result = detectSectionHeadingWithRemainder(line);
  return result ? result.section : null;
}

/**
 * Splits resume text into sections by headings.
 */
function splitResumeSections(text) {
  const rawLines = text ? text.split(/\r?\n/) : [];
  const sections = {
    header: [],
    summary: [],
    skills: [],
    projects: [],
    experience: [],
    education: [],
    certifications: [],
    other: [],
  };

  let currentSection = "header";
  let totalLines = 0;

  for (const rawLine of rawLines) {
    const trimmed = rawLine.replace(ZERO_WIDTH_CHAR_REGEX, "").trim();
    if (!trimmed) continue;
    totalLines++;

    const headingResult = detectSectionHeadingWithRemainder(trimmed);
    if (headingResult) {
      currentSection = headingResult.section;
      if (headingResult.remainder) {
        sections[currentSection].push(headingResult.remainder);
      }
      continue;
    }

    sections[currentSection].push(trimmed);
  }

  return { sections, totalLines };
}

/**
 * Checks whether a bullet starts with an action verb (allowing a leading adverb like "Successfully").
 */
function startsWithActionVerb(bullet) {
  const words = bullet.trim().split(/\s+/);
  const firstWord = (words[0] || "").toLowerCase().replace(/[^a-z-]/g, "");
  if (ACTION_VERBS.has(firstWord)) return true;
  if (firstWord.endsWith("ly") && words.length > 1) {
    const secondWord = (words[1] || "").toLowerCase().replace(/[^a-z-]/g, "");
    if (ACTION_VERBS.has(secondWord)) return true;
  }
  return false;
}

/**
 * Determines whether a glyphless wrapped continuation line should join the previous bullet.
 * Two separate bullets where the second starts with an uppercase action verb are never joined;
 * joins ONLY when the next line starts with a lowercase letter.
 */
function shouldJoinContinuationLine(prevRawLine, line, hasGlyph) {
  if (!line || hasGlyph) return false;
  if (!prevRawLine || /[.;:]$/.test(prevRawLine)) return false;
  if (isMetadataOrStackLine(line) || isLinkOnlyMetadataLine(line)) return false;
  return /^[a-z]/.test(line);
}

/**
 * Determines whether a section line is a Project or Experience heading rather than a bullet/prose line.
 * A project heading is a short line (max 12 words) that has NO trailing period, does NOT start with an action verb,
 * and typically contains "|", "–", "-", a tech list, "Live", "GitHub", or a date.
 */
export function isEntryHeadingLine(line, nextLine) {
  if (!line) return false;
  if (isMetadataOrStackLine(line) || isLinkOnlyMetadataLine(line)) return false;

  const style = detectBulletStyle(line);
  if (style !== "plain") {
    // Explicit bullet glyphs (•, -, *, 1.) are bullets, NEVER headings
    return false;
  }

  const cleaned = line.trim();
  if (!cleaned) return false;

  // A line that ends with "." is NEVER a heading (it is a bullet/sentence)
  if (/[.!?]$/.test(cleaned)) return false;

  // A line that starts with an action verb or weak phrase is NEVER a heading
  if (startsWithActionVerb(cleaned) || WEAK_PHRASE_START_REGEX.test(cleaned)) return false;

  // Must not start with lowercase
  if (/^[a-z]/.test(cleaned)) return false;

  const wordsCount = cleaned.split(/\s+/).filter((w) => /[a-zA-Z0-9]/.test(w)).length;
  // A project heading is a short line (max 12 words)
  if (wordsCount === 0 || wordsCount > 12) return false;

  // Check heading cues: "|", "–", "-", a tech list, "Live", "GitHub", or a date
  const hasSeparator = line.includes("|") || line.includes("–") || line.includes("—") || line.includes("-");
  const hasDateCue = DATE_RANGE_SUFFIX_REGEX.test(cleaned) || /\b(?:19|20)\d{2}\b/.test(cleaned);
  const hasLinkCue = /\b(?:live|github|demo|source|repo|code|website)\b/i.test(cleaned) || hasProjectLinkSignal(cleaned);
  const hasTechListCue =
    /(?:\([^)]*[A-Za-z][^)]*\)|:\s*[A-Za-z0-9.+#-]+|\btech\s*stack\b|\bbuilt\s*with\b)/i.test(cleaned) ||
    extractSkillsFromText(cleaned).length >= 1;

  if (hasSeparator || hasDateCue || hasLinkCue || hasTechListCue) {
    return true;
  }

  // Short line (< 6 words) followed by bullets or metadata
  if (wordsCount < 6 && nextLine) {
    const nextStyle = detectBulletStyle(nextLine);
    const nextCleaned = nextStyle !== "plain" ? stripBulletGlyphPrefix(nextLine) : nextLine.trim();
    const nextWords = nextCleaned.split(/\s+/).filter((w) => /[a-zA-Z0-9]/.test(w)).length;
    return (
      nextStyle !== "plain" ||
      isMetadataOrStackLine(nextLine) ||
      isLinkOnlyMetadataLine(nextLine) ||
      startsWithActionVerb(nextCleaned) ||
      /[.!?]$/.test(nextCleaned) ||
      nextWords >= 6
    );
  }

  return false;
}

/**
 * Parses Project or Experience sections into heading-bounded entry blocks (capped at maxBlocks).
 * When a non-empty section has no clear headings, falls back to 1 block.
 */
function parseStructuredBlocks(sectionLines, { maxBlocks = 8, fallbackTitle = "Block" } = {}) {
  if (!sectionLines || sectionLines.length === 0) return [];

  const blocks = [];
  let detectedHeadingCount = 0;
  let current = null;
  let fallbackBlock = null;
  let prevRawLine = "";
  let prevWasBullet = false;

  const ensureFallback = () => {
    if (!fallbackBlock) {
      fallbackBlock = { rawLines: [fallbackTitle], bullets: [] };
    }
    return fallbackBlock;
  };

  for (let i = 0; i < sectionLines.length; i++) {
    const line = sectionLines[i].replace(ZERO_WIDTH_CHAR_REGEX, "").trim();
    if (!line) continue;

    const nextLine = i + 1 < sectionLines.length ? sectionLines[i + 1].trim() : "";
    const style = detectBulletStyle(line);
    const hasGlyph = style !== "plain";
    const cleaned = hasGlyph ? stripBulletGlyphPrefix(line) : line;
    const wordsCount = cleaned.split(/\s+/).filter((w) => /[a-zA-Z0-9]/.test(w)).length;

    if (isEntryHeadingLine(line, nextLine)) {
      detectedHeadingCount++;
      if (blocks.length < maxBlocks) {
        current = { rawLines: [line], bullets: [] };
        blocks.push(current);
      } else {
        // Capped at maxBlocks: attach cleanly to the last block
        current = blocks[blocks.length - 1];
        current.rawLines.push(line);
      }
      prevRawLine = line;
      prevWasBullet = false;
      continue;
    }

    const target = current || ensureFallback();
    target.rawLines.push(line);

    if (isMetadataOrStackLine(cleaned) || isLinkOnlyMetadataLine(cleaned)) {
      prevRawLine = line;
      prevWasBullet = false;
      continue;
    }

    if (
      prevWasBullet &&
      target.bullets.length > 0 &&
      shouldJoinContinuationLine(prevRawLine, line, hasGlyph)
    ) {
      const lastBullet = target.bullets[target.bullets.length - 1];
      lastBullet.text = `${lastBullet.text} ${cleaned}`.trim();
      prevRawLine = line;
      continue;
    }

    // A line that starts with an action verb, ends with ".", or has 8+ words is ALWAYS a bullet.
    // A heading must NEVER swallow bullets below it.
    if (
      hasGlyph ||
      startsWithActionVerb(cleaned) ||
      WEAK_PHRASE_START_REGEX.test(cleaned) ||
      /[.!?]$/.test(cleaned) ||
      wordsCount >= 8 ||
      wordsCount >= 6 ||
      (wordsCount >= 3 && (startsWithActionVerb(cleaned) || WEAK_PHRASE_START_REGEX.test(cleaned) || /[.!?]$/.test(cleaned)))
    ) {
      target.bullets.push({ text: cleaned, style: hasGlyph ? style : "plain" });
      prevWasBullet = true;
    } else {
      prevWasBullet = false;
    }
    prevRawLine = line;
  }

  const rawBlocks =
    detectedHeadingCount > 0
      ? blocks.slice(0, Math.min(maxBlocks, detectedHeadingCount))
      : fallbackBlock
      ? [fallbackBlock]
      : [];

  return rawBlocks.map((b) => {
    const fullText = b.rawLines.join("\n");
    const skills = extractSkillsFromText(fullText);
    const hasTechStack =
      skills.length >= 1 ||
      /(?:tech\s*stack|technologies|built\s*with|tools\s*used|stack)\s*:/i.test(fullText);
    const hasLink = hasProjectLinkSignal(fullText);
    return {
      fullText,
      bullets: b.bullets,
      hasTechStack,
      hasLink,
    };
  });
}

/**
 * Detects near-duplicate bullets (80%+ word overlap) and repeated sentences inside a bullet,
 * merging them into ONE and returning { deduplicatedBullets, duplicateBulletCount }.
 */
export function deduplicateBullets(bullets) {
  if (!bullets || bullets.length === 0) return { deduplicatedBullets: [], duplicateBulletCount: 0 };
  let duplicateBulletCount = 0;
  const processedBullets = [];

  for (const rawBullet of bullets) {
    const rawText = typeof rawBullet === "string" ? rawBullet : rawBullet?.text || "";
    if (!rawText.trim()) continue;

    // 1. Detect sentence repeated or near-identical inside one bullet (e.g. "Developed X using Brevo. Developed X through Brevo")
    const sentences = rawText
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter(Boolean);

    let cleanedSentences = [];
    if (sentences.length > 1) {
      const kept = [];
      for (const sent of sentences) {
        const words = sent
          .toLowerCase()
          .replace(/[.!?]/g, "")
          .split(/\s+/)
          .filter(Boolean);
        let isDupSentence = false;
        for (const prev of kept) {
          const prevWords = prev
            .toLowerCase()
            .replace(/[.!?]/g, "")
            .split(/\s+/)
            .filter(Boolean);
          const prevSet = new Set(prevWords);
          const common = words.filter((w) => prevSet.has(w));
          const overlap = common.length / Math.min(words.length, prevWords.length);
          if (overlap >= 0.75) {
            isDupSentence = true;
            duplicateBulletCount++;
            break;
          }
        }
        if (!isDupSentence) {
          kept.push(sent);
        }
      }
      cleanedSentences = kept;
    } else {
      cleanedSentences = sentences;
    }

    const mergedText = cleanedSentences.join(" ");
    const bulletObj =
      typeof rawBullet === "string"
        ? { text: mergedText, style: "plain" }
        : { ...rawBullet, text: mergedText };

    // 2. Detect near-duplicate bullet (80%+ word overlap) with an earlier bullet in the same section
    const curWords = mergedText
      .toLowerCase()
      .replace(/[.!?]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 1);
    const curSet = new Set(curWords);

    let isBulletDup = false;
    for (const prevBullet of processedBullets) {
      const prevWords = prevBullet.text
        .toLowerCase()
        .replace(/[.!?]/g, "")
        .split(/\s+/)
        .filter((w) => w.length > 1);
      const prevSet = new Set(prevWords);
      const common = curWords.filter((w) => prevSet.has(w));
      const overlap = common.length / Math.max(curWords.length, prevWords.length);
      if (overlap >= 0.8) {
        isBulletDup = true;
        duplicateBulletCount++;
        break;
      }
    }

    if (!isBulletDup) {
      processedBullets.push(bulletObj);
    }
  }

  return { deduplicatedBullets: processedBullets, duplicateBulletCount };
}

function parseProjects(projectLines) {
  return parseStructuredBlocks(projectLines, {
    maxBlocks: SCORING_RUBRIC.projectQuality.maxProjects,
    fallbackTitle: "Project",
  });
}

function parseExperienceEntries(experienceLines) {
  return parseStructuredBlocks(experienceLines, {
    maxBlocks: SCORING_RUBRIC.projectQuality.maxProjects,
    fallbackTitle: "Experience",
  });
}

/**
 * Inspects text for future dates compared strictly against current IST date
 */
function checkForFutureDates(text, currentIST) {
  const currentYear = currentIST.getFullYear();
  const currentMonth = currentIST.getMonth();

  const monthNames = {
    jan: 0, january: 0, feb: 1, february: 1, mar: 2, march: 2, apr: 3, april: 3,
    may: 4, jun: 5, june: 5, jul: 6, july: 6, aug: 7, august: 7, sep: 8, september: 8,
    oct: 9, october: 9, nov: 10, november: 10, dec: 11, december: 11,
  };

  const futureDates = [];

  const monthYearRegex =
    /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)[,\s]+(20\d{2})\b/gi;
  let match;
  while ((match = monthYearRegex.exec(text)) !== null) {
    const mStr = match[1].toLowerCase();
    const yVal = parseInt(match[2], 10);
    const mVal = monthNames[mStr];

    if (yVal > currentYear || (yVal === currentYear && mVal > currentMonth)) {
      futureDates.push(match[0]);
    }
  }

  const standaloneYearRegex = /\b(20[2-9]\d)\b/g;
  while ((match = standaloneYearRegex.exec(text)) !== null) {
    const yVal = parseInt(match[1], 10);
    if (yVal > currentYear + 4) {
      futureDates.push(match[0]);
    } else if (yVal > currentYear && !futureDates.includes(match[0])) {
      const start = Math.max(0, match.index - 30);
      const context = text.slice(start, match.index + 20).toLowerCase();
      if (!context.includes("expect") && !context.includes("graduat") && !context.includes("class of")) {
        futureDates.push(match[0]);
      }
    }
  }

  return Array.from(new Set(futureDates));
}

/**
 * Checks whether month-bearing dates follow a single consistent format.
 */
function evaluateDateConsistency(text) {
  const monthNameMatches =
    text.match(
      /\b(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\.?\s+(?:19|20)\d{2}\b/gi
    ) || [];
  const numericMonthMatches =
    text.match(
      /\b(?:\d{1,2}\/\d{1,2}\/(?:19|20)\d{2}|(?:0?[1-9]|1[0-2])[/-](?:19|20)\d{2}|(?:19|20)\d{2}[/-](?:0?[1-9]|1[0-2]))\b/g
    ) || [];
  const yearRangeMatches =
    text.match(/\b(?:19|20)\d{2}\s*[-–—]\s*(?:(?:19|20)\d{2}|present|current|ongoing|now)\b/gi) || [];

  const hasNamed = monthNameMatches.length > 0;
  const hasNumeric = numericMonthMatches.length > 0;

  if (hasNamed && hasNumeric) {
    return { status: "mixed", isConsistent: false, hasDates: true };
  }
  if (hasNamed || hasNumeric || yearRangeMatches.length > 0) {
    return { status: "consistent", isConsistent: true, hasDates: true };
  }
  return { status: "none", isConsistent: false, hasDates: false };
}

/**
 * Calculates grade based on overall score
 */
export function calculateGrade(score) {
  for (const band of SCORING_RUBRIC.gradeBands) {
    if (score >= band.min) return band.grade;
  }
  return "F";
}

/**
 * Pure deterministic scoring function for extracted resume text.
 *
 * @param {Object} params
 * @param {string} params.text Extracted plain text
 * @param {number} [params.pageCount]
 * @param {number} [params.fileSize]
 * @param {boolean} [params.hasTableOrColumns]
 * @param {boolean} [params.isScanned]
 * @param {Object} [params.contactBooleans] { hasEmail, hasPhone, hasLinkedIn, hasGitHub }
 * @param {string[]} [params.targetSkills] Skills from targeted job or description
 * @param {string[]} [params.candidateProfileSkills] Skills on candidate's profile
 * @returns {Object} Deterministic report object
 */
export function scoreResumeDeterministically({
  text,
  pageCount,
  fileSize = 0,
  hasTableOrColumns = false,
  isScanned = false,
  contactBooleans,
  targetSkills = [],
  candidateProfileSkills = [],
}) {
  const issues = [];
  const currentIST = getCurrentISTDate();
  const currentISTStr = currentIST.toLocaleDateString("en-IN", {
    month: "short",
    year: "numeric",
  });

  const words = typeof text === "string" ? text.split(/\s+/).filter(Boolean) : [];
  const wordCount = words.length;

  // ── Scanned / Image-Only / Empty Edge Case ──────────────────────────────────
  if (
    isScanned ||
    !text ||
    typeof text !== "string" ||
    text.trim().length === 0 ||
    wordCount < SCORING_RUBRIC.parsingLayout.minReadableWords
  ) {
    issues.push({
      severity: "high",
      title: "No readable text detected",
      detail:
        "Your resume has no readable text, so automated screening systems cannot extract your details.",
      fix: "Export your resume directly as a text-based PDF from Google Docs, Word, or LaTeX instead of uploading a scanned image or screenshot.",
    });

    const subScores = {
      atsCompatibility: 0,
      impactAchievements: 0,
      skillsValidation: 0,
      projectQuality: 0,
      writingQuality: 0,
      professionalism: 0,
    };

    const emptyReason = [`${wordCount} readable words detected`];
    const subScoreReasons = {
      atsCompatibility: emptyReason,
      impactAchievements: ["0 bullets parsed"],
      skillsValidation: ["0 skills detected"],
      projectQuality: ["0 projects detected"],
      writingQuality: ["0 bullets evaluated"],
      professionalism: ["0 readable words detected"],
    };

    return {
      score: 0,
      grade: "F",
      subScores,
      subScoreReasons,
      stats: {
        parseRate: 0,
        recruiterMatch: targetSkills.length > 0 ? 0 : null,
        experience: "Fresher",
        wordCount: 0,
        approxPages: pageCount || 1,
      },
      quickInsights: [
        {
          tone: "bad",
          title: "Text Extraction Failure",
          detail: "Automated screening systems cannot extract text from image-only PDFs.",
        },
        {
          tone: "bad",
          title: "No Quantified Impact",
          detail: "Zero metrics or achievements can be parsed.",
        },
        {
          tone: "bad",
          title: "Unreadable Skills",
          detail: "Skill tags cannot be recognized by screening software.",
        },
        {
          tone: "bad",
          title: "Missing Contact Basics",
          detail: "Recruiters cannot parse your contact details.",
        },
      ],
      issues,
      keywords: {
        present: [],
        missing: targetSkills.slice(0, 15),
      },
    };
  }

  const approxPages = Math.max(1, Math.ceil(wordCount / 450));
  const effectivePageCount =
    typeof pageCount === "number" && pageCount > 0 ? pageCount : approxPages;
  const effectiveHasTableOrColumns =
    Boolean(hasTableOrColumns) || detectTableOrMultiColumnText(text);

  const detectedContacts = redactResumeText(text).contactBooleans;
  const effectiveContacts = {
    hasEmail: Boolean(contactBooleans?.hasEmail) || detectedContacts.hasEmail,
    hasPhone: Boolean(contactBooleans?.hasPhone) || detectedContacts.hasPhone,
    hasLinkedIn: Boolean(contactBooleans?.hasLinkedIn) || detectedContacts.hasLinkedIn,
    hasGitHub: Boolean(contactBooleans?.hasGitHub) || detectedContacts.hasGitHub,
  };

  // ── Section splitting & structured block/bullet extraction ──────────────────
  const { sections, totalLines } = splitResumeSections(text);
  const parsedProjects = parseProjects(sections.projects);
  const parsedExperience = parseExperienceEntries(sections.experience);

  // Deduplicate bullets across projects & experience
  let duplicateBulletCount = 0;
  for (const p of parsedProjects) {
    const dedup = deduplicateBullets(p.bullets);
    p.bullets = dedup.deduplicatedBullets;
    duplicateBulletCount += dedup.duplicateBulletCount;
  }
  for (const e of parsedExperience) {
    const dedup = deduplicateBullets(e.bullets);
    e.bullets = dedup.deduplicatedBullets;
    duplicateBulletCount += dedup.duplicateBulletCount;
  }

  const projectBulletItems = parsedProjects.flatMap((p) => p.bullets);
  const experienceBulletItems = parsedExperience.flatMap((e) => e.bullets);
  const bulletItems = [...projectBulletItems, ...experienceBulletItems];
  const bullets = bulletItems.map((b) => b.text);

  // ── 1. Parsing & Layout (Weight 25%) ────────────────────────────────────────
  const pCfg = SCORING_RUBRIC.parsingLayout;
  let atsScore = pCfg.baseScore;

  if (wordCount < pCfg.sparseWordsThreshold) {
    atsScore -= pCfg.sparseWordsPenalty;
    issues.push({
      severity: "medium",
      title: "Very sparse resume content",
      detail: `Only ${wordCount} words were extracted, which leaves recruiters with too little evidence.`,
      fix: "Expand your project, skill, and education details to fill a clean 1-page resume.",
    });
  }

  const hasEducation = sections.education.length > 0;
  const hasDegreeEvidence = DEGREE_EVIDENCE_REGEX.test(text);
  const hasExperience = sections.experience.length > 0;
  const hasProjects = sections.projects.length > 0;
  const hasSkills = sections.skills.length > 0;
  const sectionsFoundCount = [
    hasEducation || hasDegreeEvidence,
    hasExperience,
    hasProjects,
    hasSkills,
  ].filter(Boolean).length;

  if (!hasEducation) {
    if (hasDegreeEvidence) {
      issues.push({
        severity: "low",
        title: "Education found but without a clear heading",
        detail: "Degree or institution credentials were detected, but not under a standard 'Education' heading.",
        fix: "Add an explicit 'Education' section heading with your degree, college name, and year.",
      });
    } else {
      atsScore -= pCfg.missingCoreHeadingPenalty;
      issues.push({
        severity: "high",
        title: "Missing 'Education' section heading",
        detail: "Screening tools look for standard headings like 'Education' to extract degree information.",
        fix: "Add an explicit 'Education' section with your degree, college name, and year.",
      });
    }
  }
  if (!hasSkills) {
    atsScore -= pCfg.missingCoreHeadingPenalty;
    issues.push({
      severity: "high",
      title: "Missing dedicated 'Skills' section heading",
      detail: "Recruiter screening tools categorize candidates by scanning a dedicated Skills section.",
      fix: "Create a 'Technical Skills' or 'Skills' section grouping your languages, frameworks, and databases.",
    });
  }
  if (!hasProjects) {
    atsScore -= pCfg.missingCoreHeadingPenalty;
    issues.push({
      severity: "medium",
      title: "Missing 'Projects' section heading",
      detail: "For fresher and early-career candidates, projects provide the strongest evidence of practical capability.",
      fix: "Add a 'Projects' section detailing 2-3 technical projects with tools used.",
    });
  }
  if (!hasExperience) {
    atsScore -= pCfg.missingExperienceHeadingPenalty;
  }

  if (effectiveHasTableOrColumns) {
    atsScore -= pCfg.tableOrColumnsPenalty;
    issues.push({
      severity: "medium",
      title: "Multi-column or table formatting detected",
      detail: "Complex multi-column or table layouts often scramble text order in automated screening software.",
      fix: "Switch to a clean single-column layout with standard top-to-bottom reading order.",
    });
  }

  const wordsPerPage = effectivePageCount > 0 ? wordCount / effectivePageCount : wordCount;
  const hasSparseMultiplePages =
    effectivePageCount > 1 && wordsPerPage < pCfg.sparsePageWordsPerPageThreshold;

  if (hasSparseMultiplePages) {
    issues.push({
      severity: "low",
      title: `Your PDF has ${effectivePageCount} pages but very little text; check for blank pages or large spacing.`,
      detail: `Extracted ${wordCount} words across ${effectivePageCount} pages (~${Math.round(wordsPerPage)} words per page).`,
      fix: "Remove extra blank pages, wide margins, or excessive spacing so your resume fits cleanly.",
    });
  } else if (
    wordCount > pCfg.maxWords ||
    (effectivePageCount > pCfg.maxPages && wordsPerPage >= pCfg.minWordsPerPageForLengthPenalty)
  ) {
    atsScore -= pCfg.overLengthPenalty;
    issues.push({
      severity: "medium",
      title: "Resume exceeds recommended length",
      detail: `Your resume spans ${effectivePageCount} page(s) (${wordCount} words). Freshers should aim for a concise 1-2 page resume.`,
      fix: "Trim older school achievements or verbose phrasing to fit cleanly on 1 page.",
    });
  }

  const oversizeFile = fileSize >= pCfg.maxFileSizeBytes;
  if (oversizeFile) {
    atsScore -= pCfg.oversizeFilePenalty;
    issues.push({
      severity: "low",
      title: "File size exceeds 2 MB",
      detail: "Large PDFs can be slow to upload and may exceed portal attachment limits.",
      fix: "Compress your PDF using standard PDF tools to keep it under 2 MB.",
    });
  }

  const replacementCharCount = (text.match(REPLACEMENT_CHAR_REGEX) || []).length;
  const controlCharsCount = (text.match(CONTROL_CHAR_REGEX) || []).length;
  const privateUseCount = (text.match(PRIVATE_USE_GLYPHS_REGEX) || []).length;
  const corruptedCount = replacementCharCount + controlCharsCount;

  if (corruptedCount >= 10) {
    atsScore -= pCfg.oddCharactersPenalty;
    issues.push({
      severity: "medium",
      title:
        "Some characters in your PDF could not be read, usually from an icon font or special font. Re-export the PDF with standard fonts.",
      detail: `${corruptedCount} unreadable or encoding-corrupted characters were found in extracted text.`,
      fix: "Re-export your PDF using standard fonts (e.g. Inter, Calibri, Times New Roman) to avoid font-encoding artifacts.",
    });
  }

  atsScore = Math.min(100, Math.max(0, Math.round(atsScore)));

  const atsReasons = [
    `${sectionsFoundCount} of 4 standard headings found`,
    `${effectivePageCount} page(s), ${wordCount} words`,
    `${effectiveHasTableOrColumns ? "table/multi-column detected" : "single-column layout"}, ${corruptedCount} odd char(s)`,
  ];

  // ── 2. Impact & Achievements (Weight 20%) ───────────────────────────────────
  const iCfg = SCORING_RUBRIC.impact;
  let metricBulletsCount = 0;
  let actionVerbBulletsCount = 0;

  for (const bullet of bullets) {
    if (METRIC_REGEX.test(bullet)) {
      metricBulletsCount++;
    }
    if (startsWithActionVerb(bullet)) {
      actionVerbBulletsCount++;
    }
  }

  const totalBulletsCount = bullets.length;
  const metricShare = totalBulletsCount > 0 ? metricBulletsCount / totalBulletsCount : 0;
  const actionVerbShare = totalBulletsCount > 0 ? actionVerbBulletsCount / totalBulletsCount : 0;

  const metricPoints = interpolateCurve(metricShare, iCfg.shareCurve);
  const actionVerbPoints = interpolateCurve(actionVerbShare, iCfg.shareCurve);
  const impactScore = Math.min(
    100,
    Math.max(
      0,
      Math.round(metricPoints * iCfg.metricWeight + actionVerbPoints * iCfg.actionVerbWeight)
    )
  );

  // ── Debug log (Item 8): Log once per analysis (counts and keys ONLY, no resume text)
  const projectHeadingsDetected = parsedProjects.length;
  const projectBulletsDetected = parsedProjects.reduce((acc, p) => acc + p.bullets.length, 0);
  const experienceBulletsDetected = parsedExperience.reduce((acc, e) => acc + e.bullets.length, 0);
  const sectionsDetected = Object.keys(sections).filter((k) => sections[k].length > 0);
  const linesPerSection = Object.fromEntries(
    Object.entries(sections).map(([k, v]) => [k, v.length])
  );
  const oddChars = {
    replacementChar: replacementCharCount,
    controlChars: controlCharsCount,
    privateUse: privateUseCount,
  };

  console.log(
    `[resumeScoring] sectionsDetected=${JSON.stringify(sectionsDetected)}, linesPerSection=${JSON.stringify(linesPerSection)}, oddChars=${JSON.stringify(oddChars)}, projectHeadingsDetected=${projectHeadingsDetected}, projectBulletsDetected=${projectBulletsDetected}, experienceBulletsDetected=${experienceBulletsDetected}, duplicateBulletCount=${duplicateBulletCount}`
  );

  if (duplicateBulletCount > 0) {
    issues.push({
      severity: "medium",
      title: "Possible duplicate content",
      detail: `${duplicateBulletCount} duplicate or near-duplicate bullet point(s) detected.`,
      fix: "Remove or rewrite duplicate bullet points to showcase distinct accomplishments.",
    });
  }

  if (metricShare < 0.25) {
    issues.push({
      severity: "high",
      title: "Few or no quantifiable metrics in bullets",
      detail: `${metricBulletsCount} of ${totalBulletsCount} project/experience bullets include measurable outcomes.`,
      fix: "Incorporate metrics into your project bullets (e.g. 'Optimized API response time by 35%' or 'Built for 500+ active users').",
    });
  }
  if (actionVerbShare < 0.5) {
    issues.push({
      severity: "medium",
      title: "Bullets lack strong action verbs",
      detail: `${actionVerbBulletsCount} of ${totalBulletsCount} bullets open with a strong action verb.`,
      fix: "Begin each project and experience bullet with strong action verbs like 'Architected', 'Implemented', 'Engineered', or 'Optimized'.",
    });
  }

  const impactReasons = [
    `${metricBulletsCount} of ${totalBulletsCount} bullets have metrics`,
    `${actionVerbBulletsCount} of ${totalBulletsCount} bullets start with action verbs`,
  ];

  // ── 3. Project Quality (Weight 15%) ─────────────────────────────────────────
  const prCfg = SCORING_RUBRIC.projectQuality;
  const totalProjectBullets = parsedProjects.reduce((acc, p) => acc + p.bullets.length, 0);
  const projectCount = parsedProjects.length;
const avgProjectBullets = projectCount > 0 ? totalProjectBullets / projectCount : 0;
  const projectsWithTech = parsedProjects.filter((p) => p.hasTechStack).length;
  const projectsWithLink = parsedProjects.filter((p) => p.hasLink).length;
  const projectMetricBullets = parsedProjects.reduce(
    (acc, p) => acc + p.bullets.filter((b) => METRIC_REGEX.test(b.text)).length,
    0
  );
  const projectMetricShare =
    totalProjectBullets > 0 ? projectMetricBullets / totalProjectBullets : 0;

  const projCountPts = Math.round(
    Math.min(1, projectCount / prCfg.minProjectsForFull) * prCfg.projectCountPoints
  );
  const projBulletsPts = Math.round(
    Math.min(1, avgProjectBullets / prCfg.minAvgBulletsForFull) * prCfg.avgBulletsPoints
  );
  const projTechPts =
    projectCount > 0
      ? Math.round((projectsWithTech / projectCount) * prCfg.techStackPoints)
      : 0;
  const projLinkPts =
    projectCount > 0
      ? Math.round((projectsWithLink / projectCount) * prCfg.linkPoints)
      : 0;
  const projMetricsPts = Math.round(
    Math.min(1, projectMetricShare / prCfg.minMetricShareForFull) * prCfg.metricsPoints
  );

  const projectScore = Math.min(
    100,
    Math.max(0, projCountPts + projBulletsPts + projTechPts + projLinkPts + projMetricsPts)
  );

  const experienceHasLinkSignal = hasProjectLinkSignal(sections.experience.join("\n"));

  if (projectCount === 0) {
    issues.push({
      severity: "high",
      title: "No projects section identified",
      detail: "Without industry experience, strong technical projects are the primary factor recruiters evaluate.",
      fix: "Add 2-3 substantive technical projects demonstrating problem solving and clean architecture.",
    });
  } else {
    if (avgProjectBullets < 2.5) {
      issues.push({
        severity: "medium",
        title: "Few descriptive bullet points for projects",
        detail: `Found ${projectCount} project(s) with an average of ${avgProjectBullets.toFixed(1)} bullets per project.`,
        fix: "Expand each project with 3 descriptive bullets covering problem, tech stack, and measurable impact.",
      });
    }
    if (projectsWithLink === 0 && !experienceHasLinkSignal) {
      issues.push({
        severity: "low",
        title: "No project links detected",
        detail:
          "We could not detect project links in your PDF text. If you added hyperlinks behind words like 'Live' or 'GitHub', they may not be readable by automated tools, so consider also writing the URL as visible text.",
        fix: "Add visible repository or demo URLs (or link labels like Live | GitHub) next to each project.",
      });
    } else if (projectsWithLink < projectCount) {
      issues.push({
        severity: "low",
        title: "Some projects lack code or demo links",
        detail: `${projectsWithLink} of ${projectCount} project(s) include visible link text or link labels. If remaining projects have embedded hyperlinks behind words like 'Live' or 'GitHub', consider also writing the URL as visible text.`,
        fix: "Include visible repository or live deployment URLs (or labels like Live | GitHub) for all featured projects.",
      });
    }
  }

  const projectReasons = [
    `${projectCount} project(s), avg ${Number(avgProjectBullets.toFixed(1))} bullets`,
    `${projectsWithTech} of ${projectCount} name tech stack, ${projectsWithLink} with links`,
    `${projectMetricBullets} of ${totalProjectBullets} project bullets have metrics`,
  ];

  // ── 4. Skills Validation (Weight 20%) ───────────────────────────────────────
  const sCfg = SCORING_RUBRIC.skillsValidation;
  const detectedSkills = extractSkillsFromText(text);
  const projectAndExpText = [...sections.projects, ...sections.experience].join("\n");
  const backedSkillsSet = new Set(extractSkillsFromText(projectAndExpText));
  const backedSkillsCount = detectedSkills.filter((sk) => backedSkillsSet.has(sk)).length;

  console.log(
    `[resumeScoring] skillsDetected=${detectedSkills.length}, skillsBacked=${backedSkillsCount}`
  );

  const backedShare = detectedSkills.length > 0 ? backedSkillsCount / detectedSkills.length : 0;
  const backedPts = Math.round(backedShare * sCfg.backedInProjectsExpPoints);

  const skillCategoryLinesCount = sections.skills.filter((line) =>
    SKILL_CATEGORY_LINE_REGEX.test(line)
  ).length;
  const skillsSectionPts = hasSkills ? sCfg.skillsSectionPresentPoints : 0;
  const groupedCategoryPts = hasSkills
    ? Math.round(
        Math.min(1, skillCategoryLinesCount / sCfg.groupedCategoriesFullThreshold) *
          sCfg.groupedCategoriesPoints
      )
    : 0;

  const benchmarkSkills = targetSkills.length > 0 ? targetSkills : candidateProfileSkills;
  const keywordComparison = compareSkills(detectedSkills, benchmarkSkills);

  let lastBucketPts = 0;
  if (targetSkills.length > 0) {
    const targetOverlap = keywordComparison.present.length / targetSkills.length;
    lastBucketPts = Math.round(targetOverlap * sCfg.recognizedOrTargetPoints);

    if (keywordComparison.missing.length > 0) {
      issues.push({
        severity: "medium",
        title: `${keywordComparison.missing.length} target role skill(s) missing`,
        detail: `Missing key skills required by the target role: ${keywordComparison.missing.slice(0, 4).join(", ")}.`,
        fix: "If you have hands-on experience with any of these missing skills, add them to your Skills and Project descriptions.",
      });
    }
  } else {
    lastBucketPts = Math.round(
      Math.min(1, detectedSkills.length / sCfg.minRecognizedSkillsForFull) *
        sCfg.recognizedOrTargetPoints
    );
  }

  const skillsScore = Math.min(
    100,
    Math.max(0, backedPts + skillsSectionPts + groupedCategoryPts + lastBucketPts)
  );

  if (detectedSkills.length < sCfg.minRecognizedSkillsForFull) {
    issues.push({
      severity: "high",
      title: "Low technical skill count detected",
      detail: `Only ${detectedSkills.length} recognized technical skill(s) were identified across your resume.`,
      fix: "Explicitly list modern languages, libraries, databases, and developer tools in a grouped Skills section.",
    });
  }
  if (detectedSkills.length > 0 && backedShare < 0.7) {
    issues.push({
      severity: "medium",
      title: "Skills not backed by project details",
      detail: `${backedSkillsCount} of ${detectedSkills.length} detected skills appear in your Projects or Experience sections.`,
      fix: "Mention how you applied key skills in your project and internship bullets.",
    });
  }

  const skillsReasons = [
    `${backedSkillsCount} of ${detectedSkills.length} skills backed in projects/experience`,
    hasSkills
      ? `Skills section present (${skillCategoryLinesCount} category group(s))`
      : "No dedicated Skills section",
    targetSkills.length > 0
      ? `${keywordComparison.present.length} of ${targetSkills.length} target skills matched`
      : `${detectedSkills.length} recognized technical skills detected`,
  ];

  // ── 5. Writing Quality (Weight 10%) ─────────────────────────────────────────
  const wCfg = SCORING_RUBRIC.writingQuality;
  let writingScore = wCfg.baseScore;
  let outsideWordRangeCount = 0;
  let weakPhrasesCount = 0;
  let firstPersonCount = 0;
  let repeatedOpenersCount = 0;

  if (bullets.length === 0) {
    writingScore = wCfg.noBulletsScore;
  } else {
    for (const b of bullets) {
      const bWordCount = b.split(/\s+/).filter(Boolean).length;
      if (bWordCount < wCfg.minWords || bWordCount > wCfg.maxWords) {
        outsideWordRangeCount++;
      }
    }

    const proseScope = [...sections.summary, ...bullets, ...sections.other].join("\n");
    const weakMatches = proseScope.match(WEAK_PHRASE_REGEX) || [];
    weakPhrasesCount = weakMatches.length;

    const pronounMatches = proseScope.match(FIRST_PERSON_REGEX) || [];
    firstPersonCount = pronounMatches.length;

    const openerCounts = new Map();
    for (const b of bullets) {
      const opener = (b.trim().split(/\s+/)[0] || "").toLowerCase().replace(/[^a-z]/g, "");
      if (opener) {
        openerCounts.set(opener, (openerCounts.get(opener) || 0) + 1);
      }
    }
    for (const count of openerCounts.values()) {
      if (count >= wCfg.repeatedOpenerThreshold) {
        repeatedOpenersCount++;
      }
    }

    writingScore -= outsideWordRangeCount * wCfg.outsideWordRangePenalty;
    writingScore -= weakPhrasesCount * wCfg.weakPhrasePenalty;
    writingScore -= firstPersonCount * wCfg.firstPersonPenalty;
    writingScore -= repeatedOpenersCount * wCfg.repeatedOpenerPenalty;
    writingScore = Math.min(100, Math.max(0, Math.round(writingScore)));
  }

  if (outsideWordRangeCount > 0) {
    issues.push({
      severity: "low",
      title: "Inconsistent bullet point length",
      detail: `${outsideWordRangeCount} of ${bullets.length} bullet(s) fall outside the 8-25 word sweet spot.`,
      fix: "Aim for concise 1-2 line bullets (8-25 words) focusing on action, technology, and measurable outcome.",
    });
  }
  if (weakPhrasesCount > 0) {
    issues.push({
      severity: "medium",
      title: "Passive or weak phrases detected",
      detail: `${weakPhrasesCount} passive phrase(s) like 'responsible for' or 'worked on' were found.`,
      fix: "Replace passive phrases with definitive action verbs: instead of 'Responsible for building API', write 'Built and deployed REST API'.",
    });
  }
  if (firstPersonCount > 0) {
    issues.push({
      severity: "medium",
      title: "First-person pronouns used ('I', 'me', 'my')",
      detail: `${firstPersonCount} first-person pronoun(s) detected; resumes should use implied third-person phrasing.`,
      fix: "Remove pronouns like 'I', 'me', and 'my' (e.g. change 'I designed the UI' to 'Designed the UI').",
    });
  }
  if (repeatedOpenersCount > 0) {
    issues.push({
      severity: "low",
      title: "Repeated bullet opening words",
      detail: `${repeatedOpenersCount} opening verb(s) were repeated across 3 or more bullets.`,
      fix: "Vary your opening action verbs across project and experience bullets.",
    });
  }

  const writingReasons = [
    `${outsideWordRangeCount} of ${bullets.length} bullets outside 8-25 words`,
    `${weakPhrasesCount} weak phrase(s), ${firstPersonCount} first-person pronoun(s)`,
    `${repeatedOpenersCount} repeated opening word(s) (3+ bullets)`,
  ];

  // ── 6. Professionalism (Weight 10%) ─────────────────────────────────────────
  const prfCfg = SCORING_RUBRIC.professionalism;
  let profScore = 0;

  if (effectiveContacts.hasEmail) {
    profScore += prfCfg.emailPoints;
  } else {
    issues.push({
      severity: "high",
      title: "No email address found",
      detail: "A professional email address must be prominent at the top of your resume.",
      fix: "Add your email address in the header section.",
    });
  }

  if (effectiveContacts.hasPhone) {
    profScore += prfCfg.phonePoints;
  } else {
    issues.push({
      severity: "high",
      title: "No phone number found",
      detail: "Recruiters require a direct contact phone number for interview scheduling.",
      fix: "Add a 10-digit phone number with country code in your resume header.",
    });
  }

  const hasSocialUrl = effectiveContacts.hasLinkedIn || effectiveContacts.hasGitHub;
  const hasSocialLabel = /\blinkedin\b/i.test(text) || /\bgithub\b/i.test(text);
  const hasSocialLink = hasSocialUrl || hasSocialLabel;

  if (hasSocialLink) {
    profScore += prfCfg.socialLinkPoints;
    if (!hasSocialUrl && hasSocialLabel) {
      issues.push({
        severity: "low",
        title: "Profile link label detected without visible URL",
        detail:
          "Detected 'LinkedIn' or 'GitHub' text without an explicit URL. Make sure the link is also written as visible text.",
        fix: "Include visible URLs such as linkedin.com/in/username or github.com/username alongside link labels.",
      });
    }
  } else {
    issues.push({
      severity: "medium",
      title: "No LinkedIn or GitHub link found",
      detail: "Technical recruiters rely on LinkedIn and GitHub links to verify experience and code.",
      fix: "Add your LinkedIn or GitHub profile URL in your contact header.",
    });
  }

  const dateConsistency = evaluateDateConsistency(text);
  if (dateConsistency.isConsistent) {
    profScore += prfCfg.dateConsistencyFullPoints;
  } else if (dateConsistency.status === "none") {
    profScore += prfCfg.dateConsistencyPartialPoints;
  } else {
    issues.push({
      severity: "low",
      title: "Inconsistent date formats detected",
      detail: "Both numeric (e.g. MM/YYYY) and named-month (e.g. Jan YYYY) formats appear across entries.",
      fix: "Standardize all dates to one format such as 'May 2025 - Jul 2025'.",
    });
  }

  const glyphStyles = new Set(bulletItems.map((b) => b.style).filter((s) => s !== "plain"));
  const hasConsistentBullets =
    bulletItems.length > 0 && (glyphStyles.size === 1 || (glyphStyles.size === 0 && bulletItems.every((b) => b.style === "plain")));
  if (hasConsistentBullets) {
    profScore += prfCfg.bulletConsistencyFullPoints;
  } else if (bulletItems.length > 0) {
    profScore += prfCfg.bulletConsistencyPartialPoints;
    issues.push({
      severity: "low",
      title: "Inconsistent bullet styles detected",
      detail: `${glyphStyles.size} different bullet marker styles were used across sections.`,
      fix: "Use a single consistent bullet character (such as '•') throughout your resume.",
    });
  }

  const hasEmoji = EMOJI_REGEX.test(text);
  if (!hasEmoji) {
    profScore += prfCfg.noEmojiPoints;
  } else {
    issues.push({
      severity: "low",
      title: "Decorative emoji icons detected",
      detail: "Emojis can disrupt resume text parsing and detract from professional presentation.",
      fix: "Replace graphical emojis with standard text bullet points.",
    });
  }

  const futureDates = checkForFutureDates(text, currentIST);
  if (futureDates.length === 0) {
    profScore += prfCfg.noFutureDatesPoints;
  } else {
    issues.push({
      severity: "high",
      title: "Future dates detected",
      detail: `Dates in the future relative to today (${currentISTStr}) were detected: ${futureDates.join(", ")}.`,
      fix: "Verify all employment and project dates reflect past or ongoing completion dates.",
    });
  }

  let experience = "Fresher";
  const expMatch = text.match(/(\d+(?:\.\d+)?)\+?\s*(?:years?|yrs?)\s*(?:of)?\s*experience/i);
  if (expMatch && parseFloat(expMatch[1]) >= 0.5) {
    experience = `${expMatch[1]} years`;
  }

  if (effectivePageCount <= prfCfg.fresherMaxPages) {
    profScore += prfCfg.onePageFullPoints;
  } else if (effectivePageCount <= 2) {
    profScore += prfCfg.twoPagePartialPoints;
    if (experience === "Fresher" && !hasSparseMultiplePages) {
      issues.push({
        severity: "low",
        title: "Fresher resume exceeds 1 page",
        detail: `Your resume spans ${effectivePageCount} pages; freshers are strongly encouraged to keep resumes to 1 page.`,
        fix: "Tighten spacing or condense older details so your resume fits cleanly on 1 page.",
      });
    }
  }

  profScore = Math.min(100, Math.max(0, Math.round(profScore)));

  const socialReasonText = !hasSocialLink
    ? "no"
    : hasSocialUrl
    ? "yes"
    : "yes (label only)";

  const profReasons = [
    `Contacts: email ${effectiveContacts.hasEmail ? "yes" : "no"}, phone ${effectiveContacts.hasPhone ? "yes" : "no"}, LinkedIn/GitHub ${socialReasonText}`,
    `Future dates: ${futureDates.length} found, emojis: ${hasEmoji ? "yes" : "no"}`,
    `Dates: ${dateConsistency.status}, bullets: ${hasConsistentBullets ? "consistent" : bulletItems.length > 0 ? "mixed" : "none"}, ${effectivePageCount} page(s)`,
  ];

  // ── Overall Weighted Sum + Caps ─────────────────────────────────────────────
  const w = SCORING_RUBRIC.weights;
  let overall = Math.round(
    atsScore * w.atsCompatibility +
      impactScore * w.impactAchievements +
      skillsScore * w.skillsValidation +
      projectScore * w.projectQuality +
      writingScore * w.writingQuality +
      profScore * w.professionalism
  );

  const allSubScoresAtLeast85 = [
    atsScore,
    impactScore,
    skillsScore,
    projectScore,
    writingScore,
    profScore,
  ].every((s) => s >= SCORING_RUBRIC.caps.requiredSubScoreForTopBand);

  if (!allSubScoresAtLeast85) {
    overall = Math.min(overall, SCORING_RUBRIC.caps.maxWithoutAllSubScores85);
  }
  if (impactScore < SCORING_RUBRIC.caps.lowImpactThreshold) {
    overall = Math.min(overall, SCORING_RUBRIC.caps.maxIfImpactBelow30);
  }
  if (issues.some((issue) => issue.title.includes("Future dates"))) {
    overall = Math.min(overall, SCORING_RUBRIC.caps.maxIfFutureDates);
  }

  const finalScore = Math.min(100, Math.max(0, overall));
  const grade = calculateGrade(finalScore);

  // ── Sort Issues by Severity: high -> medium -> low ──────────────────────────
  const severityOrder = { high: 0, medium: 1, low: 2 };
  issues.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  // ── Parse Rate & Recruiter Match ────────────────────────────────────────────
  const parseRate = Math.min(
    100,
    Math.round((sectionsFoundCount / 4) * 60 + (words.length > 150 ? 40 : 20))
  );

  const recruiterMatch =
    targetSkills.length > 0
      ? Math.round((keywordComparison.present.length / targetSkills.length) * 100)
      : null;

  // ── Quick Insights (4 dynamic 3-tier items: >=80 positive, 50-79 neutral, <50 needs work)
  const profGaps = [];
  if (!effectiveContacts.hasEmail) profGaps.push("missing email");
  if (!effectiveContacts.hasPhone) profGaps.push("missing phone");
  if (!hasSocialLink) profGaps.push("missing LinkedIn/GitHub link");
  else if (!hasSocialUrl) profGaps.push("label-only profile link without visible URL");
  if (futureDates.length > 0) profGaps.push("future dates detected");
  if (dateConsistency.status === "mixed") profGaps.push("inconsistent dates");
  if (bulletItems.length > 0 && !hasConsistentBullets) profGaps.push("mixed bullet styles");
  if (hasEmoji) profGaps.push("decorative emoji icons");
  if (effectivePageCount > 1) profGaps.push(`${effectivePageCount}-page length`);

  const quickInsights = [
    {
      tone: atsScore >= 80 ? "good" : atsScore >= 50 ? "warn" : "bad",
      title: "Parsing & Layout",
      detail:
        atsScore >= 80
          ? `Clean layout and standard headings ready for automated screening (${sectionsFoundCount} of 4 standard sections).`
          : atsScore >= 50
          ? `Basic layout is readable, but structure or section headings need review (${sectionsFoundCount} of 4 standard sections).`
          : `Parsing risks detected (${sectionsFoundCount} of 4 standard sections, ${oddCharMatches.length} corrupted char(s)); use a clean single-column layout.`,
    },
    {
      tone: impactScore >= 80 ? "good" : impactScore >= 50 ? "warn" : "bad",
      title: "Action & Impact",
      detail:
        impactScore >= 80
          ? `Strong action verbs and quantified outcomes across your bullets (${metricBulletsCount} of ${totalBulletsCount} with metrics).`
          : impactScore >= 50
          ? `Moderate bullet strength (${metricBulletsCount} of ${totalBulletsCount} with metrics, ${actionVerbBulletsCount} of ${totalBulletsCount} start with action verbs); add more measurable numbers.`
          : `Add measurable numbers and start bullets with strong action verbs (${metricBulletsCount} of ${totalBulletsCount} bullets have metrics).`,
    },
    {
      tone: skillsScore >= 80 ? "good" : skillsScore >= 50 ? "warn" : "bad",
      title: "Skills Coverage",
      detail:
        skillsScore >= 80
          ? `Strong technical skill coverage (${backedSkillsCount} of ${detectedSkills.length} skills backed in Projects/Experience).`
          : skillsScore >= 50
          ? detectedSkills.length > 0 && backedSkillsCount < detectedSkills.length
            ? `Skills are listed (${backedSkillsCount} of ${detectedSkills.length} backed); link more of them in your projects.`
            : `Core skills identified (${detectedSkills.length} detected); reinforce alignment across project descriptions.`
          : detectedSkills.length > 0
          ? "Skills are listed; link them to your projects."
          : "Few recognized technical skills detected; add relevant languages, frameworks, and tools in a grouped Skills section.",
    },
    {
      tone: profScore >= 80 ? "good" : profScore >= 50 ? "warn" : "bad",
      title: "Professional Standards",
      detail:
        profScore >= 80 && profGaps.length === 0
          ? "Complete contact links, consistent dates and bullets, and concise formatting."
          : profScore >= 80
          ? `Strong presentation overall; refine ${profGaps.join(", ")}.`
          : profScore >= 50
          ? `Fair presentation, with gaps in ${profGaps.length > 0 ? profGaps.join(", ") : "contact links, formatting consistency, or length"}.`
          : `Professional basics need attention: ${profGaps.length > 0 ? profGaps.join(", ") : "missing contacts, future dates, or styling issues"}.`,
    },
  ];

  const subScores = {
    atsCompatibility: atsScore,
    impactAchievements: impactScore,
    skillsValidation: skillsScore,
    projectQuality: projectScore,
    writingQuality: writingScore,
    professionalism: profScore,
  };

  const subScoreReasons = {
    atsCompatibility: atsReasons,
    impactAchievements: impactReasons,
    skillsValidation: skillsReasons,
    projectQuality: projectReasons,
    writingQuality: writingReasons,
    professionalism: profReasons,
  };

  return {
    score: finalScore,
    grade,
    subScores,
    subScoreReasons,
    stats: {
      parseRate,
      recruiterMatch,
      experience,
      wordCount,
      approxPages: effectivePageCount,
    },
    quickInsights,
    issues,
    keywords: {
      present: targetSkills.length > 0 ? keywordComparison.present : detectedSkills,
      missing: keywordComparison.missing,
    },
    duplicateBulletCount,
    deduplicatedBullets: bullets,
    projectHeadingsDetected,
    projectBulletsDetected,
    experienceBulletsDetected,
  };
}
