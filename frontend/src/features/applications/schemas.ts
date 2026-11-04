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

export type ApplyJobValues = z.infer<typeof applyJobSchema>;
export type UpdateApplicationStatusValues = z.infer<typeof updateApplicationStatusSchema>;

