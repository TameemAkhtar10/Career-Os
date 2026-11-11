import { openResumeDownloadStream, findResumeFile } from "./gridfs.service.js";
import { ApiError } from "../utils/ApiError.js";

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

    stream.on("data", (chunk) => {
      totalSize += chunk.length;
      if (totalSize > maxSize) {
        stream.destroy();
        reject(new ApiError(413, "Resume file exceeds maximum permitted size of 5MB."));
        return;
      }
      chunks.push(chunk);
    });

    stream.on("end", () => {
      resolve(Buffer.concat(chunks));
    });

    stream.on("error", (err) => {
      reject(new ApiError(500, `Failed to stream resume file: ${err.message}`));
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
 * Extracts text and structural metadata from a GridFS resume file
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
  const fileMeta = await findResumeFile(fileId);
  if (!fileMeta) {
    throw new ApiError(404, "Resume file not found in storage.");
  }

  const downloadStream = openResumeDownloadStream(fileId);
  const pdfBuffer = await streamToBuffer(downloadStream, MAX_PDF_SIZE);
  let pdfParse;
  try {
    // v1 ka direct path, debug-mode ENOENT bug se bachata hai
    const imported = await import("pdf-parse/lib/pdf-parse.js");
    pdfParse = imported.default || imported;
  } catch (err) {
    throw new ApiError(
      500,
      "pdf-parse dependency is not installed. Please run 'npm install pdf-parse@1.1.1' in the backend directory."
    );
  }

  let pdfData;
  try {
    pdfData = await pdfParse(pdfBuffer);
  } catch (err) {
    // sirf error message log karo, resume text kabhi nahi
    console.error("[resumeText] pdf-parse failed:", err?.message);
    throw new ApiError(400, "Unable to parse resume PDF. The file may be corrupt or encrypted.");
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

