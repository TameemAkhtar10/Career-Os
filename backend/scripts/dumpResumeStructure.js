#!/usr/bin/env node
/**
 * Dev script: dumpResumeStructure.js
 * Usage: node scripts/dumpResumeStructure.js <path-to-pdf>
 *
 * Extracts text with pdf-parse, runs section and block parsing, and prints
 * a structural dump. Works offline. Never imported by the app. Never prints
 * full resume text, emails, or phone numbers.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createRequire } from "node:module";

// pdf-parse ships as CJS; use createRequire to load it in ESM
const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse/lib/pdf-parse.js");

import {
  splitResumeSections,
  detectSectionHeading,
  isEntryHeadingLine,
  isMetadataOrStackLine,
  isLinkOnlyMetadataLine,
  scoreResumeDeterministically,
  CORRUPTED_CHAR_REGEX,
} from "../src/services/resumeScoring.service.js";

// ── Masking helpers ──────────────────────────────────────────────────────────
const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_RE = /(?:\+?91[\s-]?)?(?:0)?[6-9]\d{4}[\s-]?\d{5}|\+?[1-9]\d{0,3}[\s-]?(?:\(?\d{2,5}\)?[\s-]?)?\d{3,4}[\s-]?\d{3,4}/g;

function maskLine(line) {
  return line.replace(EMAIL_RE, "[EMAIL]").replace(PHONE_RE, "[PHONE]");
}

function firstNWords(line, n = 4) {
  const words = line.split(/\s+/).filter(Boolean);
  const prefix = words.slice(0, n).join(" ");
  return words.length > n ? `${prefix}...` : prefix;
}

// ── Bullet detection (mirror of service internals) ───────────────────────────
const UNICODE_BULLET = /^(?:[\uE000-\uF8FF\u2022-\u25FF\u2600-\u27BF•▪●◦‣⁃∙➢➤▸▹◆◇■□]\uFE0F?)\s*/u;
const ASCII_BULLET = /^(?:[-–—*]|\d{1,2}[.)])\s+/u;

function detectTag(line, nextLine) {
  const trimmed = line.trim();
  if (!trimmed) return "OTHER";
  const sectionKey = detectSectionHeading(trimmed);
  if (sectionKey) return `HEADING:${sectionKey}`;
  if (isEntryHeadingLine(trimmed, nextLine)) return "BLOCK-HEAD";
  if (isLinkOnlyMetadataLine(trimmed)) return "LINKONLY";
  if (isMetadataOrStackLine(trimmed)) return "META";
  if (UNICODE_BULLET.test(trimmed) || ASCII_BULLET.test(trimmed)) return "BULLET";
  return "OTHER";
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const pdfPath = process.argv[2];
  if (!pdfPath) {
    console.error("Usage: node scripts/dumpResumeStructure.js <path-to-pdf>");
    process.exit(1);
  }

  const absPath = resolve(pdfPath);
  const dataBuffer = readFileSync(absPath);
  const parsed = await pdfParse(dataBuffer);
  const text = parsed.text || "";
  const pageCount = parsed.numpages || 1;

  console.log(`\n=== Resume Structure Dump ===`);
  console.log(`File: ${absPath}`);
  console.log(`Pages: ${pageCount}, Bytes: ${dataBuffer.length}\n`);

  // Per-line dump
  const lines = text.split(/\r?\n/);
  console.log("--- Line-by-line tags ---");
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const trimmed = raw.trim();
    if (!trimmed) continue;
    const nextLine = i + 1 < lines.length ? lines[i + 1]?.trim() || "" : "";
    const tag = detectTag(trimmed, nextLine);
    const wordCount = trimmed.split(/\s+/).filter(Boolean).length;
    const preview = maskLine(firstNWords(trimmed, 4));
    console.log(`  ${String(i + 1).padStart(4)}  ${tag.padEnd(18)} ${String(wordCount).padStart(3)}w  ${preview}`);
  }

  // Section summary
  const { sections, totalLines } = splitResumeSections(text);
  console.log(`\n--- Sections (${totalLines} non-blank lines) ---`);
  for (const [key, sectionLines] of Object.entries(sections)) {
    if (sectionLines.length > 0) {
      console.log(`  ${key}: ${sectionLines.length} lines`);
    }
  }

  // Blocks per section
  const { parseProjects, parseExperienceEntries } = await import(
    "../src/services/resumeScoring.service.js"
  );
  if (sections.projects.length > 0) {
    const projBlocks = parseProjects(sections.projects);
    console.log(`\n--- Project blocks: ${projBlocks.length} ---`);
    for (let i = 0; i < projBlocks.length; i++) {
      console.log(`  Block ${i + 1}: ${projBlocks[i].bullets.length} bullets, tech=${projBlocks[i].hasTechStack}, link=${projBlocks[i].hasLink}`);
    }
  }
  if (sections.experience.length > 0) {
    const expBlocks = parseExperienceEntries(sections.experience);
    console.log(`\n--- Experience blocks: ${expBlocks.length} ---`);
    for (let i = 0; i < expBlocks.length; i++) {
      console.log(`  Block ${i + 1}: ${expBlocks[i].bullets.length} bullets, tech=${expBlocks[i].hasTechStack}, link=${expBlocks[i].hasLink}`);
    }
  }

  // Odd characters by code point
  const INSIDE_WORD_ODD = /(?<=[a-zA-Z])[\uFFFD\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F](?=[a-zA-Z])/gu;
  const oddMatches = text.match(INSIDE_WORD_ODD) || [];
  if (oddMatches.length > 0) {
    const byCp = {};
    for (const ch of oddMatches) {
      const cp = `U+${ch.codePointAt(0).toString(16).toUpperCase().padStart(4, "0")}`;
      byCp[cp] = (byCp[cp] || 0) + 1;
    }
    console.log(`\n--- Odd characters (inside-word only): ${oddMatches.length} ---`);
    for (const [cp, count] of Object.entries(byCp)) {
      console.log(`  ${cp}: ${count}`);
    }
  } else {
    console.log(`\n--- Odd characters: 0 ---`);
  }

  // Scoring result
  const report = scoreResumeDeterministically({
    text,
    pageCount,
    fileSize: dataBuffer.length,
  });

  console.log(`\n--- Scoring ---`);
  console.log(`  Overall: ${report.score} (${report.grade})`);
  for (const [key, val] of Object.entries(report.subScores)) {
    console.log(`  ${key}: ${val}`);
  }
  console.log(`\n--- Issues ---`);
  for (const issue of report.issues) {
    console.log(`  [${issue.severity}] ${issue.title}`);
  }

  console.log("");
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
