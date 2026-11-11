import mongoose from "mongoose";

const issueSchema = new mongoose.Schema(
  {
    severity: {
      type: String,
      enum: ["high", "medium", "low"],
      required: true,
    },
    title: { type: String, required: true },
    detail: { type: String, required: true },
    fix: { type: String, required: true },
  },
  { _id: false }
);

const quickInsightSchema = new mongoose.Schema(
  {
    tone: {
      type: String,
      enum: ["good", "warn", "bad"],
      required: true,
    },
    title: { type: String, required: true },
    detail: { type: String, required: true },
  },
  { _id: false }
);

const suggestionSchema = new mongoose.Schema(
  {
    priority: {
      type: String,
      enum: ["high", "medium", "low"],
      required: true,
    },
    title: { type: String, required: true },
    description: { type: String, required: true },
    example: { type: String, default: "" },
  },
  { _id: false }
);

const bulletRewriteSchema = new mongoose.Schema(
  {
    original: { type: String, required: true },
    improved: { type: String, required: true },
    reason: { type: String, required: true },
    metricHint: { type: String, default: "" },
  },
  { _id: false }
);

const resumeAnalysisSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    contentHash: {
      type: String,
      required: true,
    },
    cacheKey: {
      type: String,
      required: true,
      index: true,
    },
    scoringVersion: {
      type: String,
      default: "2.2.0",
    },
    aiPromptVersion: {
      type: String,
      default: "2.2.0",
    },
    target: {
      type: {
        type: String,
        enum: ["none", "job", "description"],
        default: "none",
      },
      jobId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Job",
        default: null,
      },
      jobTitle: {
        type: String,
        default: "",
      },
      targetHash: {
        type: String,
        default: "",
      },
    },
    fileName: {
      type: String,
      default: "resume.pdf",
    },
    score: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    grade: {
      type: String,
      required: true,
    },
    subScores: {
      atsCompatibility: { type: Number, default: 0 },
      impactAchievements: { type: Number, default: 0 },
      skillsValidation: { type: Number, default: 0 },
      projectQuality: { type: Number, default: 0 },
      writingQuality: { type: Number, default: 0 },
      professionalism: { type: Number, default: 0 },
    },
    subScoreReasons: {
      atsCompatibility: { type: [String], default: [] },
      impactAchievements: { type: [String], default: [] },
      skillsValidation: { type: [String], default: [] },
      projectQuality: { type: [String], default: [] },
      writingQuality: { type: [String], default: [] },
      professionalism: { type: [String], default: [] },
    },
    stats: {
      parseRate: { type: Number, default: 0 },
      recruiterMatch: { type: Number, default: null },
      experience: { type: String, default: "Fresher" },
      wordCount: { type: Number, default: 0 },
      approxPages: { type: Number, default: 1 },
    },
    quickInsights: {
      type: [quickInsightSchema],
      default: [],
    },
    issues: {
      type: [issueSchema],
      default: [],
    },
    keywords: {
      present: [{ type: String }],
      missing: [{ type: String }],
    },
    ai: {
      summary: { type: String, default: "" },
      strengths: [{ type: String }],
      improvements: [{ type: String }],
      suggestions: [suggestionSchema],
      bulletRewrites: [bulletRewriteSchema],
    },
    aiAvailable: {
      type: Boolean,
      default: false,
    },
    provider: {
      type: String,
      default: "deterministic",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes specified in prompt
resumeAnalysisSchema.index({ user: 1, createdAt: -1 });
resumeAnalysisSchema.index({ user: 1, cacheKey: 1 });

export const ResumeAnalysis = mongoose.model("ResumeAnalysis", resumeAnalysisSchema);

