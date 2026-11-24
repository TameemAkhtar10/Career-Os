import { z } from "zod";

const stripControlCharacters = (val) => {
  if (typeof val !== "string") return val;
  return val.replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F\u007F]/g, "").trim();
};

const safeString = (maxLen) =>
  z
    .string()
    .trim()
    .transform(stripControlCharacters)
    .pipe(z.string().max(maxLen));

export const createTrackerEntrySchema = z.object({
  jobTitle: safeString(150).refine((val) => val.length > 0, "Job title is required"),
  company: safeString(150).refine((val) => val.length > 0, "Company name is required"),
  location: safeString(150).optional().default(""),
  link: z
    .string()
    .trim()
    .optional()
    .default("")
    .refine((val) => {
      if (!val) return true;
      try {
        const parsed = new URL(val);
        return parsed.protocol === "http:" || parsed.protocol === "https:";
      } catch {
        return false;
      }
    }, "Link must be a valid HTTP or HTTPS URL"),
  stage: z
    .enum(["saved", "applied", "screening", "interview", "offer", "rejected", "withdrawn"])
    .optional()
    .default("saved"),
  appliedOn: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val ? new Date(val) : null)),
  notes: safeString(2000).optional().default(""),
  followUpAt: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val ? new Date(val) : null)),
  interviewAt: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val ? new Date(val) : null)),
  salaryNote: safeString(100).optional().default(""),
  remindersEnabled: z.boolean().optional().default(true),
});

export const updateTrackerEntrySchema = z.object({
  jobTitle: safeString(150).optional(),
  company: safeString(150).optional(),
  location: safeString(150).optional(),
  link: z
    .string()
    .trim()
    .optional()
    .refine((val) => {
      if (!val) return true;
      try {
        const parsed = new URL(val);
        return parsed.protocol === "http:" || parsed.protocol === "https:";
      } catch {
        return false;
      }
    }, "Link must be a valid HTTP or HTTPS URL"),
  stage: z
    .enum(["saved", "applied", "screening", "interview", "offer", "rejected", "withdrawn"])
    .optional(),
  appliedOn: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val === undefined ? undefined : val ? new Date(val) : null)),
  notes: safeString(2000).optional(),
  followUpAt: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val === undefined ? undefined : val ? new Date(val) : null)),
  interviewAt: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val === undefined ? undefined : val ? new Date(val) : null)),
  salaryNote: safeString(100).optional(),
  remindersEnabled: z.boolean().optional(),
  hidden: z.boolean().optional(),
});
