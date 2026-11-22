import { z } from "zod";

export const generateCoverLetterSchema = z.object({
  jobId: z
    .string({ required_error: "Job ID is required" })
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid job ID format"),
  tone: z.enum(["professional", "friendly", "concise"], {
    errorMap: () => ({ message: "Tone must be professional, friendly, or concise" }),
  }),
  format: z.enum(["letter", "note"]).optional().default("letter"),
  consent: z.boolean().optional(),
});

export const aiCoverLetterOutputSchema = z.object({
  subject: z.string(),
  body: z.string(),
  usedSkills: z.array(z.string()),
});
