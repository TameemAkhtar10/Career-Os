import { z } from "zod";

/**
 * Schema for POST /api/resume/analyze
 * Candidate may provide jobId OR jobDescription, but not both.
 */
export const analyzeResumeSchema = z
  .object({
    jobId: z
      .string()
      .trim()
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid job ID format")
      .optional()
      .or(z.literal("")),
    jobDescription: z
      .string()
      .trim()
      .max(6000, "Job description cannot exceed 6000 characters")
      .optional()
      .or(z.literal("")),
    consent: z.boolean().optional(),
  })
  .refine(
    (data) => {
      const hasJob = Boolean(data.jobId && data.jobId.length > 0);
      const hasJd = Boolean(data.jobDescription && data.jobDescription.length > 0);
      return !(hasJob && hasJd);
    },
    {
      message: "Please provide either a targeted job ID or a pasted job description, not both.",
      path: ["jobId"],
    }
  );

/**
 * Zod schema for validating AI feedback generation output
 */
export const aiFeedbackSchema = z.object({
  summary: z.string().default(""),
  strengths: z.array(z.string()).default([]),
  improvements: z.array(z.string()).default([]),
  suggestions: z
    .array(
      z.object({
        priority: z.enum(["high", "medium", "low"]).default("medium"),
        title: z.string().default(""),
        description: z.string().default(""),
        example: z.string().default(""),
      })
    )
    .default([]),
  missingKeywords: z.array(z.string()).default([]),
  bulletRewrites: z
    .array(
      z.object({
        original: z.string().default(""),
        improved: z.string().default(""),
        reason: z.string().default(""),
        metricHint: z.string().optional().default(""),
      })
    )
    .max(3)
    .default([]),
});

