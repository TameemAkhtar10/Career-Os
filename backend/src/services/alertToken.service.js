import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";

/**
 * Generates a signed JWT token for one-click pausing of a specific job alert without login.
 * Valid for 90 days.
 */
export const generatePauseAlertToken = ({ alertId, userId }) => {
  if (!alertId || !userId) {
    throw new Error("Missing alertId or userId for pause alert token");
  }

  return jwt.sign(
    {
      alertId: String(alertId),
      userId: String(userId),
      purpose: "pauseAlert",
    },
    env.JWT_EMAIL_SECRET,
    { expiresIn: "90d" }
  );
};

/**
 * Verifies a pause alert token.
 * Throws 400 ApiError on invalid or expired token.
 */
export const verifyPauseAlertToken = (token) => {
  if (!token || typeof token !== "string") {
    throw new ApiError(400, "Invalid or missing token.");
  }

  try {
    const payload = jwt.verify(token, env.JWT_EMAIL_SECRET);

    if (payload.purpose !== "pauseAlert" || !payload.alertId || !payload.userId) {
      throw new Error("Invalid token claims");
    }

    return {
      alertId: payload.alertId,
      userId: payload.userId,
    };
  } catch {
    throw new ApiError(400, "Invalid or expired pause link.");
  }
};
