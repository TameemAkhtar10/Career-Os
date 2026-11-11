import { CandidateProfile } from "../models/candidateProfile.model.js";
import { Job } from "../models/job.model.js";
import { Application } from "../models/application.model.js";
import { ResumeAnalysis } from "../models/ResumeAnalysis.js";
import { calculateCandidateCompleteness } from "./profile.controller.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { getCache, setCache } from "../utils/cache.js";
import { normalizeSkill } from "../utils/skillTaxonomy.js";

/**
 * Cache key generator for candidate dashboard
 */
export const candidateDashboardCacheKey = (userId) => `cache:/api/candidate/dashboard:${userId}`;

/**
 * Generates personalized, honest actionable tips based on candidate profile and latest analysis
 */
function generateCandidateTips(completeness, profile, latestAnalysis) {
  const tips = [];

  // Profile-based tips
  if (!profile?.resume?.fileId) {
    tips.push("Upload your PDF resume to unlock automated resume analysis and 1-click applications.");
  }

  if (completeness < 100) {
    if (!profile?.projects || profile.projects.length === 0) {
      tips.push("Add at least 2 technical projects with tech stacks to showcase hands-on experience to employers.");
    } else if (!profile?.skills || profile.skills.length < 5) {
      tips.push("List at least 5-8 relevant technical skills to improve your match score across open roles.");
    } else if (!profile?.links?.github && !profile?.links?.portfolio) {
      tips.push("Add your GitHub or personal portfolio link to give recruiters direct evidence of your code.");
    } else if (!profile?.about || profile.about.trim().length < 50) {
      tips.push("Write a concise summary in your profile outlining your core strengths and career goals.");
    }
  }

  // Analysis-based tips
  if (!latestAnalysis) {
    tips.push("Run a Resume Score check on your uploaded resume to benchmark your readiness against industry standards.");
  } else {
    if (latestAnalysis.score < 75) {
      const sub = latestAnalysis.subScores || {};
      if (sub.impactAchievements < 60) {
        tips.push("Boost your Impact score by adding numbers, percentages, or measurable outcomes to project bullets.");
      } else if (sub.atsCompatibility < 65) {
        tips.push("Improve Parsing & Layout by using a clean single-column format and standard section headings.");
      } else if (sub.writingQuality < 65) {
        tips.push("Strengthen writing quality by replacing passive phrases ('worked on', 'helped') with active verbs.");
      } else {
        tips.push("Review high-severity risks identified in your latest resume scan to improve your interview callback rate.");
      }
    } else {
      tips.push("Your resume score is competitive! Tailor keywords to specific job listings before submitting applications.");
    }
  }

  // Fallback general advice
  if (tips.length < 3) {
    tips.push("Keep your status set to 'Open to Work' so verified recruiters can find your profile for entry-level roles.");
  }

  return tips.slice(0, 4);
}

/**
 * GET /api/candidate/dashboard (candidate only, cached briefly)
 */
export const getCandidateDashboard = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const cacheKey = candidateDashboardCacheKey(userId);

  // Check Redis/memory cache
  const cached = await getCache(cacheKey);
  if (cached) {
    return res.status(200).json(new ApiResponse(200, cached, "Candidate dashboard fetched from cache."));
  }

  // 1. Fetch Candidate Profile
  const profile = await CandidateProfile.findOne({ user: userId }).lean();
  const completeness = profile ? calculateCandidateCompleteness(profile) : 0;
  const hasResume = Boolean(profile?.resume?.fileId);

  // 2. Fetch Latest Resume Score Analysis
  const latestAnalysis = await ResumeAnalysis.findOne({ user: userId })
    .select("_id score grade createdAt fileName target subScores")
    .sort({ createdAt: -1 })
    .lean();

  const latestResumeScore = latestAnalysis
    ? {
        id: latestAnalysis._id,
        score: latestAnalysis.score,
        grade: latestAnalysis.grade,
        date: latestAnalysis.createdAt,
        fileName: latestAnalysis.fileName,
      }
    : null;

  // 3. Applications statistics & recent 5 applications
  const applications = await Application.find({ candidate: userId })
    .populate("job", "title companyName location workMode jobType status")
    .sort({ createdAt: -1 })
    .lean();

  const applicationsByStatus = {
    applied: 0,
    shortlisted: 0,
    rejected: 0,
    hired: 0,
    withdrawn: 0,
  };

  const appliedJobIds = [];

  for (const app of applications) {
    if (app.status && applicationsByStatus[app.status] !== undefined) {
      applicationsByStatus[app.status]++;
    }
    if (app.job?._id) {
      appliedJobIds.push(app.job._id);
    }
  }

  const recentApplications = applications.slice(0, 5).map((app) => ({
    _id: app._id,
    jobTitle: app.job?.title || "Role",
    companyName: app.job?.companyName || "Company",
    status: app.status,
    appliedAt: app.createdAt,
    matchScore: app.matchScore || 0,
    jobId: app.job?._id,
  }));

  // 4. Recommended jobs (top 5 open jobs by normalized skills overlap, excluding already-applied)
  const candidateSkillsSet = new Set(
    (profile?.skills || []).map((s) => normalizeSkill(s)).filter(Boolean)
  );

  const candidatePool = await Job.find({
    status: "open",
    _id: { $nin: appliedJobIds },
  })
    .select("title companyName location workMode jobType salary skills isFresherFriendly createdAt")
    .sort({ createdAt: -1 })
    .limit(30)
    .lean();

  const scoredJobs = candidatePool.map((job) => {
    let matchScore = 0;
    if (Array.isArray(job.skills) && job.skills.length > 0 && candidateSkillsSet.size > 0) {
      const matches = job.skills.filter((s) => {
        const norm = normalizeSkill(s);
        return norm && candidateSkillsSet.has(norm);
      }).length;
      matchScore = Math.min(100, Math.round((matches / job.skills.length) * 100));
    }

    return {
      _id: job._id,
      title: job.title,
      companyName: job.companyName,
      location: job.location,
      workMode: job.workMode,
      jobType: job.jobType,
      salary: job.salary,
      skills: job.skills || [],
      isFresherFriendly: Boolean(job.isFresherFriendly),
      matchScore,
      createdAt: job.createdAt,
    };
  });

  // Sort descending by matchScore, then by freshness
  scoredJobs.sort((a, b) => b.matchScore - a.matchScore || new Date(b.createdAt) - new Date(a.createdAt));
  const recommendedJobs = scoredJobs.slice(0, 5);

  // 5. Actionable tips
  const tips = generateCandidateTips(completeness, profile, latestAnalysis);

  const payload = {
    profileCompleteness: completeness,
    hasResume,
    latestResumeScore,
    applicationsByStatus,
    recentApplications,
    recommendedJobs,
    tips,
  };

  // Cache for 60 seconds
  await setCache(cacheKey, payload, 60);

  res.status(200).json(
    new ApiResponse(200, payload, "Candidate dashboard fetched successfully.")
  );
});
