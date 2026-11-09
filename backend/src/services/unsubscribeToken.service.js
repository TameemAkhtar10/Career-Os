import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";

const VALID_PREFERENCE_TYPES = ["jobAlerts", "applicantDigest", "profileNudges"];

/**
 * Generates a signed JWT unsubscribe token for a specific user and preference type.
 * Valid for 90 days.
 */
export const generateUnsubscribeToken = ({ userId, type }) => {
  if (!userId || !type || !VALID_PREFERENCE_TYPES.includes(type)) {
    throw new Error(`Invalid unsubscribe token payload: type must be one of ${VALID_PREFERENCE_TYPES.join(", ")}`);
  }

  return jwt.sign(
    {
      userId: String(userId),
      type,
      purpose: "unsubscribe",
    },
    env.JWT_EMAIL_SECRET,
    { expiresIn: "90d" }
  );
};

/**
 * Verifies an unsubscribe token.
 * Throws 400 ApiError on invalid or expired token.
 */
export const verifyUnsubscribeToken = (token) => {
  if (!token || typeof token !== "string") {
    throw new ApiError(400, "Invalid or missing unsubscribe token.");
  }

  try {
    const payload = jwt.verify(token, env.JWT_EMAIL_SECRET);

    if (
      payload.purpose !== "unsubscribe" ||
      !payload.userId ||
      !VALID_PREFERENCE_TYPES.includes(payload.type)
    ) {
      throw new Error("Invalid token claims");
    }

    return {
      userId: payload.userId,
      type: payload.type,
    };
  } catch {
    throw new ApiError(400, "Invalid or expired unsubscribe link.");
  }
};

