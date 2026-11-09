import mongoose from "mongoose";
import { Readable } from "stream";
import { ApiError } from "../utils/ApiError.js";

let resumeBucket = null;
let currentDb = null;

/**
 * Returns or initializes the GridFSBucket for resume storage using mongoose.connection.db
 */
export const getResumeBucket = () => {
  const db = mongoose.connection.db;
  if (!db) {
    throw new ApiError(500, "Database connection not ready for resume storage.");
  }

  if (!resumeBucket || currentDb !== db) {
    currentDb = db;
    resumeBucket = new mongoose.mongo.GridFSBucket(db, {
      bucketName: "resumes",
    });
  }

  return resumeBucket;
};

/**
 * Stores a PDF buffer in GridFS under the 'resumes' bucket with metadata { userId }
 *
 * @param {Object} params
 * @param {Buffer} params.buffer
 * @param {string} params.fileName
 * @param {string} params.userId
 * @returns {Promise<{ fileId: mongoose.Types.ObjectId, fileName: string, size: number, uploadedAt: Date, storage: "gridfs" }>}
 */
export const uploadResumeToGridFS = async ({ buffer, fileName, userId }) => {
  const bucket = getResumeBucket();

  return new Promise((resolve, reject) => {
    const uploadStream = bucket.openUploadStream(fileName, {
      contentType: "application/pdf",
      metadata: { userId: String(userId) },
    });

    const fileId = uploadStream.id;
    const readable = Readable.from(buffer);

    readable.pipe(uploadStream)
      .on("error", (err) => {
        console.error("[GridFS Upload Error]:", err);
        reject(new ApiError(502, "Failed to store resume in database storage."));
      })
      .on("finish", () => {
        resolve({
          fileId,
          fileName,
          size: buffer.length,
          uploadedAt: new Date(),
          storage: "gridfs",
        });
      });
  });
};

/**
 * Deletes a resume file from GridFS by its ObjectId
 *
 * @param {string|mongoose.Types.ObjectId} fileId
 */
export const deleteResumeFromGridFS = async (fileId) => {
  if (!fileId) return;
  const bucket = getResumeBucket();
  try {
    const objectId = typeof fileId === "string" ? new mongoose.Types.ObjectId(fileId) : fileId;
    await bucket.delete(objectId);
  } catch (err) {
    console.error(`[GridFS Delete Error for ${fileId}]:`, err.message || err);
    // Non-blocking: do not crash if file already removed or not found
  }
};

/**
 * Opens a readable download stream for a resume file stored in GridFS
 *
 * @param {string|mongoose.Types.ObjectId} fileId
 * @returns {import("mongodb").GridFSBucketReadStream}
 */
export const openResumeDownloadStream = (fileId) => {
  const bucket = getResumeBucket();
  const objectId = typeof fileId === "string" ? new mongoose.Types.ObjectId(fileId) : fileId;
  return bucket.openDownloadStream(objectId);
};

/**
 * Finds file metadata in resumes.files to verify existence and length
 *
 * @param {string|mongoose.Types.ObjectId} fileId
 * @returns {Promise<Object|null>}
 */
export const findResumeFile = async (fileId) => {
  if (!fileId) return null;
  const bucket = getResumeBucket();
  try {
    const objectId = typeof fileId === "string" ? new mongoose.Types.ObjectId(fileId) : fileId;
    const files = await bucket.find({ _id: objectId }).toArray();
    return files[0] || null;
  } catch (err) {
    return null;
  }
};

