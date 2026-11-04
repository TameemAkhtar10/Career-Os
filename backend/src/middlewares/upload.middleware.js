import multer from "multer";
import path from "path";
import { ApiError } from "../utils/ApiError.js";

// Use memory storage so we can check magic bytes directly before sending to ImageKit
const storage = multer.memoryStorage();

/**
 * Sanitizes an uploaded filename to prevent directory traversal and special chars
 */
export const sanitizeFileName = (originalName = "file", defaultExt = "") => {
  const base = path.basename(originalName);
  const ext = path.extname(base) || defaultExt;
  const nameWithoutExt = path.basename(base, ext).replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 50);
  return `${nameWithoutExt || "document"}${ext.toLowerCase()}`;
};

/**
 * Checks magic bytes of a PDF file
 */
export const isPdfBuffer = (buffer) => {
  if (!buffer || buffer.length < 4) return false;
  return buffer.slice(0, 4).toString("ascii") === "%PDF";
};

/**
 * Checks magic bytes of an image file (PNG, JPEG, WEBP)
 */
export const isImageBuffer = (buffer) => {
  if (!buffer || buffer.length < 12) return false;

  // PNG: 89 50 4E 47
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return true;
  }

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return true;
  }

  // WEBP: RIFF....WEBP
  if (
    buffer.slice(0, 4).toString("ascii") === "RIFF" &&
    buffer.slice(8, 12).toString("ascii") === "WEBP"
  ) {
    return true;
  }

  return false;
};

// 2 MB limit for resume
const resumeMulter = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
}).single("resume");

// 1 MB limit for logo
const logoMulter = multer({
  storage,
  limits: { fileSize: 1 * 1024 * 1024 }, // 1 MB
}).single("logo");

/**
 * Express middleware for resume upload with magic bytes validation
 */
export const handleResumeUpload = (req, res, next) => {
  resumeMulter(req, res, (err) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return next(new ApiError(413, "Resume file size exceeds the 2 MB limit."));
      }
      return next(new ApiError(400, err.message || "Invalid file upload."));
    }

    if (!req.file) {
      return next(new ApiError(400, "Please provide a resume file under the 'resume' field."));
    }

    // Verify magic bytes
    if (!isPdfBuffer(req.file.buffer)) {
      return next(new ApiError(400, "Invalid file format. Only PDF files are allowed."));
    }

    req.sanitizedFileName = sanitizeFileName(req.file.originalname, ".pdf");
    next();
  });
};

/**
 * Express middleware for company logo upload with magic bytes validation
 */
export const handleLogoUpload = (req, res, next) => {
  logoMulter(req, res, (err) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return next(new ApiError(413, "Logo image size exceeds the 1 MB limit."));
      }
      return next(new ApiError(400, err.message || "Invalid image upload."));
    }

    if (!req.file) {
      return next(new ApiError(400, "Please provide an image file under the 'logo' field."));
    }

    // Verify magic bytes
    if (!isImageBuffer(req.file.buffer)) {
      return next(new ApiError(400, "Invalid image format. Only PNG, JPG, or WEBP images are allowed."));
    }

    req.sanitizedFileName = sanitizeFileName(req.file.originalname, ".png");
    next();
  });
};
