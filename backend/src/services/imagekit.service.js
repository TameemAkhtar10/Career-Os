import ImageKit from "imagekit";
import { ApiError } from "../utils/ApiError.js";

let imagekitInstance = null;

export const getImageKitClient = () => {
  if (imagekitInstance) return imagekitInstance;

  const publicKey = process.env.IMAGEKIT_PUBLIC_KEY;
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
  const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT;

  if (!publicKey || !privateKey || !urlEndpoint) {
    throw new ApiError(500, "Storage service is not configured. Missing ImageKit credentials.");
  }

  imagekitInstance = new ImageKit({
    publicKey,
    privateKey,
    urlEndpoint,
  });

  return imagekitInstance;
};

/**
 * Uploads a candidate resume as a private file into /resumes/<userId>
 */
export const uploadResumeFile = async ({ buffer, fileName, userId }) => {
  const client = getImageKitClient();
  try {
    const res = await client.upload({
      file: buffer,
      fileName,
      folder: `/resumes/${userId}`,
      isPrivateFile: true,
      useUniqueFileName: true,
    });
    return {
      fileId: res.fileId,
      fileName: res.name,
      filePath: res.filePath,
      url: res.url,
      size: res.size,
      uploadedAt: new Date(),
    };
  } catch (err) {
    console.error("[ImageKit Resume Upload Error]:", err);
    throw new ApiError(502, "Failed to upload resume. Please try again.");
  }
};

/**
 * Uploads a recruiter company logo as a public file into /logos/<userId>
 */
export const uploadLogoFile = async ({ buffer, fileName, userId }) => {
  const client = getImageKitClient();
  try {
    const res = await client.upload({
      file: buffer,
      fileName,
      folder: `/logos/${userId}`,
      isPrivateFile: false,
      useUniqueFileName: true,
    });
    return {
      fileId: res.fileId,
      url: res.url,
      size: res.size,
    };
  } catch (err) {
    console.error("[ImageKit Logo Upload Error]:", err);
    throw new ApiError(502, "Failed to upload company logo. Please try again.");
  }
};

/**
 * Deletes a file from ImageKit by fileId
 */
export const deleteFileFromImageKit = async (fileId) => {
  if (!fileId) return;
  const client = getImageKitClient();
  try {
    await client.deleteFile(fileId);
  } catch (err) {
    console.error(`[ImageKit Delete Error for ${fileId}]:`, err.message || err);
    // Non-blocking: do not crash if file already deleted
  }
};

/**
 * Generates a signed URL valid for ~5 minutes (300 seconds)
 */
export const getSignedUrl = (filePathOrUrl) => {
  const client = getImageKitClient();
  try {
    // If it starts with / or is a relative path in ImageKit
    if (filePathOrUrl.startsWith("http://") || filePathOrUrl.startsWith("https://")) {
      return client.url({
        src: filePathOrUrl,
        signed: true,
        expireSeconds: 300,
      });
    }

    return client.url({
      path: filePathOrUrl,
      signed: true,
      expireSeconds: 300,
    });
  } catch (err) {
    console.error("[ImageKit Signed URL Error]:", err);
    throw new ApiError(502, "Failed to generate secure document URL.");
  }
};
