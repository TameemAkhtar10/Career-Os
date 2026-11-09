import { User } from "../models/user.model.js";
import { verifyUnsubscribeToken } from "../services/unsubscribeToken.service.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { delCache } from "../utils/cache.js";

/**
 * POST /api/notifications/unsubscribe
 * Public endpoint to unsubscribe via signed token.
 */
export const unsubscribeWithToken = asyncHandler(async (req, res) => {
  const { token } = req.body;

  const { userId, type } = verifyUnsubscribeToken(token);

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(400, "Invalid or expired unsubscribe link.");
  }

  if (!user.emailPreferences) {
    user.emailPreferences = {
      jobAlerts: true,
      applicantDigest: true,
      profileNudges: true,
    };
  }

  user.emailPreferences[type] = false;
  await user.save();

  await delCache(`user:${user._id}`);

  res.status(200).json(
    new ApiResponse(
      200,
      {
        unsubscribed: true,
        type,
      },
      "You have been successfully unsubscribed from this email notification."
    )
  );
});

