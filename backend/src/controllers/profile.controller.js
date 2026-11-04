import mongoose from "mongoose";
import { CandidateProfile } from "../models/candidateProfile.model.js";
import { RecruiterProfile } from "../models/recruiterProfile.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { delCache } from "../utils/cache.js";

/**
 * Cache key builder for the user's personal profile endpoint.
 */
export const profileMeCacheKey = (userId) => `cache:/api/profile/me:${userId}`;

/**
 * Computes profile completeness percentage (0 - 100) for a candidate profile.
 * Freshers are prioritized, so experience is treated as a bonus.
 * Weights:
 * - headline: 10%
 * - about: 10%
 * - phone: 5%
 * - location (city or state): 10%
 * - education (>= 1): 15%
 * - skills (>= 1): 20%
 * - projects (>= 1): 15%
 * - experience (>= 1): 5% (bonus)
 * - resumeUrl: 5%
 * - links (at least one of github, linkedin, portfolio): 5%
 * Total = 100% (capped at 100)
 */
export const calculateCandidateCompleteness = (profile) => {
  if (!profile) return 0;
  let score = 0;

  if (profile.headline && profile.headline.trim().length > 0) score += 10;
  if (profile.about && profile.about.trim().length > 0) score += 10;
  if (profile.phone && profile.phone.trim().length > 0) score += 5;
  if (
    profile.location &&
    ((profile.location.city && profile.location.city.trim().length > 0) ||
      (profile.location.state && profile.location.state.trim().length > 0))
  ) {
    score += 10;
  }
  if (Array.isArray(profile.education) && profile.education.length > 0) score += 15;
  if (Array.isArray(profile.skills) && profile.skills.length > 0) score += 20;
  if (Array.isArray(profile.projects) && profile.projects.length > 0) score += 15;
  if (Array.isArray(profile.experience) && profile.experience.length > 0) score += 5;
  if (profile.resumeUrl && profile.resumeUrl.trim().length > 0) score += 5;
  if (
    profile.links &&
    ((profile.links.github && profile.links.github.trim().length > 0) ||
      (profile.links.linkedin && profile.links.linkedin.trim().length > 0) ||
      (profile.links.portfolio && profile.links.portfolio.trim().length > 0))
  ) {
    score += 5;
  }

  return Math.min(100, Math.max(0, score));
};

/**
 * GET /api/profile/me (protected)
 * Returns the profile matching the authenticated user's role, or null if not yet created.
 */
export const getProfileMe = asyncHandler(async (req, res) => {
  const { role, _id: userId } = req.user;

  if (role === "candidate") {
    const profile = await CandidateProfile.findOne({ user: userId }).populate(
      "user",
      "name email role"
    );

    if (!profile) {
      return res.status(200).json(new ApiResponse(200, null, "Profile not created yet"));
    }

    const profileData = profile.toObject();
    profileData.profileCompleteness = calculateCandidateCompleteness(profileData);

    return res.status(200).json(new ApiResponse(200, profileData, "Profile fetched successfully"));
  }

  if (role === "recruiter") {
    const profile = await RecruiterProfile.findOne({ user: userId }).populate(
      "user",
      "name email role"
    );

    if (!profile) {
      return res.status(200).json(new ApiResponse(200, null, "Profile not created yet"));
    }

    return res.status(200).json(new ApiResponse(200, profile, "Profile fetched successfully"));
  }

  // Admin or other roles
  return res.status(200).json(new ApiResponse(200, null, "Profile not created yet"));
});

/**
 * PUT /api/profile/candidate (candidate only)
 * Creates or updates own candidate profile (upsert).
 */
export const upsertCandidateProfile = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Never trust userId from body; always enforce auth user ID
  const updatePayload = {
    ...req.body,
    user: userId,
  };

  const profile = await CandidateProfile.findOneAndUpdate(
    { user: userId },
    updatePayload,
    {
      upsert: true,
      returnDocument: "after",
      setDefaultsOnInsert: true,
      runValidators: true,
    }
  ).populate("user", "name email role");

  // Invalidate personal profile cache
  await delCache(profileMeCacheKey(userId));

  const profileData = profile.toObject();
  profileData.profileCompleteness = calculateCandidateCompleteness(profileData);

  res.status(200).json(new ApiResponse(200, profileData, "Candidate profile saved successfully"));
});

/**
 * PUT /api/profile/recruiter (recruiter only)
 * Creates or updates own recruiter profile (upsert).
 */
export const upsertRecruiterProfile = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Never trust userId from body; always enforce auth user ID
  const updatePayload = {
    ...req.body,
    user: userId,
  };

  const profile = await RecruiterProfile.findOneAndUpdate(
    { user: userId },
    updatePayload,
    {
      upsert: true,
      returnDocument: "after",
      setDefaultsOnInsert: true,
      runValidators: true,
    }
  ).populate("user", "name email role");

  // Invalidate personal profile cache
  await delCache(profileMeCacheKey(userId));

  res.status(200).json(new ApiResponse(200, profile, "Recruiter profile saved successfully"));
});

/**
 * GET /api/profile/candidate/:userId (recruiter or admin only)
 * View a candidate's public profile (phone hidden unless viewer is admin).
 */
export const getCandidateProfileById = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, "Invalid candidate user ID.");
  }

  const isAdmin = req.user.role === "admin";
  const userFields = isAdmin ? "name email role" : "name role";

  const profile = await CandidateProfile.findOne({ user: userId }).populate(
    "user",
    userFields
  );

  if (!profile) {
    throw new ApiError(404, "Candidate profile not found.");
  }

  const profileData = profile.toObject();
  profileData.profileCompleteness = calculateCandidateCompleteness(profileData);

  // Recruiters must only get name and role (no email, no phone); only admin may see email and phone
  if (!isAdmin) {
    delete profileData.phone;
    if (profileData.user && profileData.user.email) {
      delete profileData.user.email;
    }
  }

  res.status(200).json(
    new ApiResponse(200, profileData, "Candidate profile fetched successfully")
  );
});
