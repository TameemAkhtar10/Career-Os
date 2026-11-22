import { ResumeDraft } from "../models/ResumeDraft.js";
import { CandidateProfile } from "../models/candidateProfile.model.js";
import { User } from "../models/user.model.js";
import { buildResumePdf, generateResumePlainText } from "../services/resumePdf.service.js";
import { scoreResumeDeterministically } from "../services/resumeScoring.service.js";
import {
  uploadResumeToGridFS,
  deleteResumeFromGridFS,
} from "../services/gridfs.service.js";
import { deleteFileFromImageKit } from "../services/imagekit.service.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { delCache } from "../utils/cache.js";
import { profileMeCacheKey } from "./profile.controller.js";

/**
 * Builds clean prefill data ONLY from candidate's existing profile fields.
 * Never invents any data.
 */
function buildPrefillFromProfile(userDoc, profileDoc) {
  const contact = {
    email: userDoc?.email || "",
    phone: profileDoc?.phone || "",
    city: profileDoc?.location?.city || "",
    linkedin: profileDoc?.links?.linkedin || "",
    github: profileDoc?.links?.github || "",
    portfolio: profileDoc?.links?.portfolio || "",
  };

  const skills = [];
  if (Array.isArray(profileDoc?.skills) && profileDoc.skills.length > 0) {
    skills.push({
      category: "Technical Skills",
      items: profileDoc.skills,
    });
  }

  const education = (profileDoc?.education || []).map((ed) => ({
    degree: ed.degree || "",
    institute: ed.institute || "",
    startYear: null,
    endYear: ed.year || null,
    grade: ed.grade || "",
  }));

  const projects = (profileDoc?.projects || []).map((p) => ({
    name: p.title || "",
    techStack: p.techStack || [],
    link: p.link || "",
    bullets: p.description
      ? p.description
          .split(/\r?\n/)
          .map((s) => s.replace(/^[•\-\*]\s*/, "").trim())
          .filter(Boolean)
          .slice(0, 5)
      : [],
  }));

  const experience = (profileDoc?.experience || []).map((exp) => ({
    role: exp.title || "",
    company: exp.company || "",
    startDate: exp.from ? new Date(exp.from).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "",
    endDate: exp.to ? new Date(exp.to).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "",
    current: !exp.to,
    bullets: exp.description
      ? exp.description
          .split(/\r?\n/)
          .map((s) => s.replace(/^[•\-\*]\s*/, "").trim())
          .filter(Boolean)
          .slice(0, 5)
      : [],
  }));

  return {
    template: "classic",
    fullName: userDoc?.name || "",
    headline: profileDoc?.headline || "",
    contact,
    summary: (profileDoc?.about || "").slice(0, 400),
    skills,
    education,
    projects,
    experience,
    certifications: [],
    sectionOrder: ["summary", "skills", "projects", "experience", "education", "certifications"],
  };
}

/**
 * GET /api/resume-builder
 * Returns the candidate's existing draft or prefill suggestions from their profile.
 */
export const getResumeDraft = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const existingDraft = await ResumeDraft.findOne({ user: userId }).lean();
  if (existingDraft) {
    return res.status(200).json(
      new ApiResponse(200, { draft: existingDraft, isPrefill: false }, "Resume draft fetched.")
    );
  }

  const [userDoc, profileDoc] = await Promise.all([
    User.findById(userId).select("name email").lean(),
    CandidateProfile.findOne({ user: userId }).lean(),
  ]);

  const prefill = buildPrefillFromProfile(userDoc, profileDoc);

  res.status(200).json(
    new ApiResponse(200, { draft: prefill, isPrefill: true }, "Prefill suggestions generated.")
  );
});

/**
 * PUT /api/resume-builder
 * Autosaves candidate's draft (own record only).
 */
export const saveResumeDraft = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const updatedDraft = await ResumeDraft.findOneAndUpdate(
    { user: userId },
    { ...req.body, user: userId },
    { upsert: true, returnDocument: "after", runValidators: true }
  ).lean();

  res.status(200).json(
    new ApiResponse(200, { draft: updatedDraft }, "Resume draft saved successfully.")
  );
});

/**
 * POST /api/resume-builder/pdf
 * Generates single-column text PDF and streams it as attachment.
 * Accepts draft in body or falls back to saved draft.
 */
export const downloadResumePdf = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  let draftData = req.body;
  const hasBodyContent = Boolean(
    draftData && (draftData.fullName || draftData.summary || draftData.skills?.length || draftData.projects?.length)
  );

  if (!hasBodyContent) {
    const saved = await ResumeDraft.findOne({ user: userId }).lean();
    if (!saved) {
      throw new ApiError(404, "No resume draft found to generate PDF.");
    }
    draftData = saved;
  }

  const { buffer, pageCount } = await buildResumePdf(draftData);

  const safeName = (draftData.fullName || "Candidate").replace(/[^a-zA-Z0-9_-]/g, "_");

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${safeName}_Resume.pdf"`);
  res.setHeader("X-Resume-Pages", String(pageCount));
  res.setHeader("Content-Length", String(buffer.length));

  res.end(buffer);
});

/**
 * POST /api/resume-builder/use-as-resume
 * Generates the PDF and saves it as candidate's profile resume through existing GridFS path.
 */
export const useAsProfileResume = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  let draftData = req.body;
  const hasBodyContent = Boolean(
    draftData && (draftData.fullName || draftData.summary || draftData.skills?.length || draftData.projects?.length)
  );

  if (!hasBodyContent) {
    const saved = await ResumeDraft.findOne({ user: userId }).lean();
    if (!saved) {
      throw new ApiError(404, "No resume draft found to save to profile.");
    }
    draftData = saved;
  }

  const { buffer } = await buildResumePdf(draftData);

  // Respect 2 MB limit
  if (buffer.length > 2 * 1024 * 1024) {
    throw new ApiError(413, "Generated PDF exceeds the 2 MB profile resume limit.");
  }

  let profile = await CandidateProfile.findOne({ user: userId });
  if (!profile) {
    profile = await CandidateProfile.create({ user: userId });
  }

  // Delete previous resume from its store if exists
  if (profile.resume && profile.resume.fileId) {
    if (profile.resume.storage === "gridfs") {
      await deleteResumeFromGridFS(profile.resume.fileId);
    } else {
      await deleteFileFromImageKit(profile.resume.fileId);
    }
  }

  const safeFileName = `${(draftData.fullName || "Candidate").replace(/[^a-zA-Z0-9_-]/g, "_")}_Resume.pdf`;

  const uploaded = await uploadResumeToGridFS({
    buffer,
    fileName: safeFileName,
    userId: String(userId),
  });

  profile.resume = {
    fileId: uploaded.fileId,
    fileName: uploaded.fileName,
    filePath: uploaded.fileName,
    size: uploaded.size,
    uploadedAt: uploaded.uploadedAt,
    storage: "gridfs",
  };

  await profile.save();
  await delCache(profileMeCacheKey(userId));

  res.status(200).json(
    new ApiResponse(
      200,
      {
        resume: {
          fileName: profile.resume.fileName,
          size: profile.resume.size,
          uploadedAt: profile.resume.uploadedAt,
        },
      },
      "Resume generated and set as your active profile resume."
    )
  );
});

/**
 * DELETE /api/resume-builder
 * Deletes candidate's resume draft.
 */
export const deleteResumeDraft = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  await ResumeDraft.deleteOne({ user: userId });

  res.status(200).json(
    new ApiResponse(200, null, "Resume draft deleted successfully.")
  );
});

/**
 * POST /api/resume-builder/check
 * Runs deterministic scoring check on the generated text. No AI. Never stores text.
 */
export const checkResumeDraftQuality = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  let draftData = req.body;
  const hasBodyContent = Boolean(
    draftData && (draftData.fullName || draftData.summary || draftData.skills?.length || draftData.projects?.length)
  );

  if (!hasBodyContent) {
    const saved = await ResumeDraft.findOne({ user: userId }).lean();
    if (!saved) {
      throw new ApiError(404, "No resume draft found to check.");
    }
    draftData = saved;
  }

  const { text, pageCount } = await buildResumePdf(draftData);

  const contactBooleans = {
    hasEmail: Boolean(draftData.contact?.email),
    hasPhone: Boolean(draftData.contact?.phone),
    hasLinkedIn: Boolean(draftData.contact?.linkedin),
    hasGitHub: Boolean(draftData.contact?.github),
  };

  const allSkills = (draftData.skills || []).flatMap((c) => c.items || []);

  const report = scoreResumeDeterministically({
    text,
    pageCount,
    fileSize: text.length,
    hasTableOrColumns: false,
    isScanned: false,
    contactBooleans,
    targetSkills: [],
    candidateProfileSkills: allSkills,
  });

  res.status(200).json(
    new ApiResponse(
      200,
      {
        score: report.score,
        grade: report.grade,
        subScores: report.subScores,
        topIssues: (report.issues || []).slice(0, 3),
        pageCount,
      },
      "Quality check complete."
    )
  );
});
