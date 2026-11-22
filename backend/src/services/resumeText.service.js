import { createRequire } from "node:module";
import { openResumeDownloadStream, findResumeFile } from "./gridfs.service.js";
import { ApiError } from "../utils/ApiError.js";

const require = createRequire(import.meta.url);

let pdfParse = null;
try {
  pdfParse = require("pdf-parse/lib/pdf-parse.js");
} catch (err) {
  console.warn("[resumeText] Warning: Initial require of pdf-parse/lib/pdf-parse.js failed:", err?.message);
}

const MAX_PDF_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_TEXT_LENGTH = 20000; // max 20,000 characters

/**
 * Accumulates a readable stream into a single Buffer
 * @param {import("stream").Readable} stream
 * @param {number} maxSize
 * @returns {Promise<Buffer>}
 */
async function streamToBuffer(stream, maxSize = MAX_PDF_SIZE) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let totalSize = 0;
    let settled = false;

    stream.on("data", (chunk) => {
      totalSize += chunk.length;
      if (totalSize > maxSize) {
        settled = true;
        stream.destroy();
        reject(new ApiError(413, "Resume file exceeds maximum permitted size of 5MB."));
        return;
      }
      chunks.push(chunk);
    });

    stream.on("end", () => {
      if (!settled) {
        settled = true;
        resolve(Buffer.concat(chunks));
      }
    });

    stream.on("close", () => {
      if (!settled) {
        settled = true;
        resolve(Buffer.concat(chunks));
      }
    });

    stream.on("error", (err) => {
      if (!settled) {
        settled = true;
        reject(new ApiError(500, `Failed to stream resume file: ${err.message}`));
      }
    });
  });
}

/**
 * Detects signs of tables or multi-column layout from extracted whitespace patterns
 * @param {string} text
 * @returns {boolean}
 */
export function detectTableOrMultiColumn(text) {
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
 * Extracts text and structural metadata from a GridFS resume file.
 *
 * Throws descriptive ApiErrors so callers can present a meaningful message
 * to the user instead of a generic 500.
 *
 * @param {string|import("mongoose").Types.ObjectId} fileId
 * @returns {Promise<{
 *   text: string,
 *   pageCount: number,
 *   fileSize: number,
 *   hasTableOrColumns: boolean,
 *   isScanned: boolean,
 *   wordCount: number
 * }>}
 */
export async function extractResumeTextFromGridFS(fileId) {
  // ── 1. Verify file exists in GridFS ────────────────────────────────────────
  let fileMeta;
  try {
    fileMeta = await findResumeFile(fileId);
  } catch (err) {
    console.error("[resumeText] findResumeFile threw:", err?.message || err);
    throw new ApiError(500, "Could not locate your resume in storage. Please re-upload and try again.");
  }

  if (!fileMeta) {
    console.error(`[resumeText] File not found in GridFS for fileId=${fileId}`);
    throw new ApiError(
      404,
      "Your resume file was not found in storage. Please re-upload your resume and try again."
    );
  }

  // ── 2. Stream file into buffer ──────────────────────────────────────────────
  let pdfBuffer;
  try {
    const downloadStream = openResumeDownloadStream(fileId);
    pdfBuffer = await streamToBuffer(downloadStream, MAX_PDF_SIZE);
  } catch (err) {
    // Re-throw ApiErrors unchanged (size limit etc.)
    if (err?.statusCode) throw err;
    console.error("[resumeText] GridFS stream error:", err?.message || err);
    throw new ApiError(500, "Failed to download your resume from storage. Please try again.");
  }

  // ── 3. Load pdf-parse (fallback if not loaded) ─────────────────────────────
  if (!pdfParse) {
    try {
      const imported = await import("pdf-parse/lib/pdf-parse.js");
      pdfParse = imported.default || imported;
    } catch (err) {
      console.error("[resumeText] pdf-parse import failed:", err?.message || err);
      throw new ApiError(
        500,
        "PDF parsing dependency is unavailable. Please contact support."
      );
    }
  }

  // ── 4. Parse PDF ────────────────────────────────────────────────────────────
  let pdfData;
  try {
    pdfData = await pdfParse(pdfBuffer);
  } catch (err) {
    // Log parse error (never log resume content)
    console.error("[resumeText] pdf-parse failed:", err?.message || err);
    throw new ApiError(
      400,
      "Unable to read your resume PDF. The file may be corrupt, password-protected, or image-only. Please upload a text-based PDF."
    );
  }

  const rawText = (pdfData.text || "").trim();
  const pageCount = pdfData.numpages || 1;
  const fileSize = pdfBuffer.length;

  const words = rawText.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  // Determine if resume is scanned / image-only (minimal or unreadable text)
  const isScanned = rawText.length < 50 || wordCount < 15;

  // Keep max 20,000 characters
  const truncatedText = rawText.slice(0, MAX_TEXT_LENGTH);
  const hasTableOrColumns = !isScanned && detectTableOrMultiColumn(truncatedText);

  return {
    text: isScanned ? "" : truncatedText,
    pageCount,
    fileSize,
    hasTableOrColumns,
    isScanned,
    wordCount: isScanned ? 0 : wordCount,
  };
}

