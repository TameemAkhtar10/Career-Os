import { z } from "zod";

export const applyJobSchema = z.object({
  coverNote: z
    .string()
    .trim()
    .max(1000, "Cover note cannot exceed 1000 characters")
    .optional()
    .default(""),
});

export const updateApplicationStatusSchema = z.object({
  status: z.enum(["shortlisted", "rejected", "hired"], {
    errorMap: () => ({ message: "Status must be 'shortlisted', 'rejected', or 'hired'" }),
  }),
  recruiterNote: z
    .string()
    .trim()
    .max(500, "Recruiter note cannot exceed 500 characters")
    .optional(),
});

export const jobIdParamSchema = z.object({
  jobId: z
    .string()
    .trim()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid job ID"),
});

export const applicationIdParamSchema = z.object({
  id: z
    .string()
    .trim()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid application ID"),
});
