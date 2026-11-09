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
 * Deletes a file from ImageKit by fileId (used for company logos and legacy resumes)
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
