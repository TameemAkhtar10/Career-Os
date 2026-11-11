/**
 * Redacts Personally Identifiable Information (PII) from resume text before sending to third-party AI.
 * Keeps contact detection booleans for deterministic scoring.
 */

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi;

// Indian (+91, 0, or 10 digits starting with 6-9) and standard international phone numbers
const PHONE_REGEX = /(?:\+?91[\s-]?)?(?:0)?[6-9]\d{4}[\s-]?\d{5}|\+?[1-9]\d{0,3}[\s-]?(?:\(?\d{2,5}\)?[\s-]?)?\d{3,4}[\s-]?\d{3,4}/g;

// URLs: http, https, www, linkedin, github, portfolio links
const URL_REGEX = /(?:https?:\/\/|www\.)[^\s<>"',)]+|linkedin\.com\/(?:in\/)?[a-zA-Z0-9_-]+|github\.com\/[a-zA-Z0-9_.-]+|[a-zA-Z0-9-]+\.(?:com|org|net|io|dev|in|co|ai)\/[^\s<>"',)]+/gi;

// Street addresses and postal pin codes
const PIN_CODE_REGEX = /\b[1-9][0-9]{5}\b/g;
const ADDRESS_KEYWORDS_REGEX = /\b(?:road|street|nagar|sector|colony|layout|apartment|flat|h\.?\s*no\.?|house|lane|marg|cross|pin\s*code|pincode)\b/i;

/**
 * Redacts PII from resume text and extracts deterministic contact booleans
 *
 * @param {string} text Raw extracted resume text
 * @param {string} [userName] Candidate's registered name
 * @returns {{ redactedText: string, contactBooleans: { hasEmail: boolean, hasPhone: boolean, hasLinkedIn: boolean, hasGitHub: boolean } }}
 */
export function redactResumeText(text, userName = "") {
  if (!text || typeof text !== "string") {
    return {
      redactedText: "",
      contactBooleans: {
        hasEmail: false,
        hasPhone: false,
        hasLinkedIn: false,
        hasGitHub: false,
      },
    };
  }

  // 1. Detect contact booleans from raw text before redaction
  const hasEmail = EMAIL_REGEX.test(text);
  EMAIL_REGEX.lastIndex = 0; // reset regex state

  const hasPhone = PHONE_REGEX.test(text);
  PHONE_REGEX.lastIndex = 0;

  const hasLinkedIn = /linkedin\.com/i.test(text);
  const hasGitHub = /(?:github\.com|gitlab\.com)/i.test(text);

  // 2. Perform redaction
  let redacted = text;

  // Redact emails
  redacted = redacted.replace(EMAIL_REGEX, "[EMAIL]");

  // Redact phone numbers
  redacted = redacted.replace(PHONE_REGEX, "[PHONE]");

  // Redact URLs
  redacted = redacted.replace(URL_REGEX, "[LINK]");

  // Redact address lines (lines containing pin codes or common address indicators)
  const lines = redacted.split(/\r?\n/);
  const cleanedLines = lines.map((line) => {
    if (PIN_CODE_REGEX.test(line) || ADDRESS_KEYWORDS_REGEX.test(line)) {
      PIN_CODE_REGEX.lastIndex = 0;
      return "[ADDRESS]";
    }
    return line;
  });
  redacted = cleanedLines.join("\n");

  // Redact candidate name if provided
  if (userName && typeof userName === "string" && userName.trim().length > 1) {
    const trimmed = userName.trim();
    // Replace full name
    const fullNameRegex = new RegExp(`\\b${trimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi");
    redacted = redacted.replace(fullNameRegex, "[NAME]");

    // Also replace individual name tokens if longer than 2 characters
    const parts = trimmed.split(/\s+/).filter((p) => p.length > 2);
    for (const part of parts) {
      const partRegex = new RegExp(`\\b${part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi");
      redacted = redacted.replace(partRegex, "[NAME]");
    }
  }

  return {
    redactedText: redacted,
    contactBooleans: {
      hasEmail,
      hasPhone,
      hasLinkedIn,
      hasGitHub,
    },
  };
}

