import { z } from "zod";

/**
 * Strips non-printable ASCII control characters (except tab/newline) and zero-width unicode characters.
 */
export function sanitizeString(val) {
  if (typeof val !== "string") return "";
  return val
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\u200B-\u200D\uFEFF]/g, "")
    .trim();
}

const cleanString = (maxLen) =>
  z
    .string()
    .transform(sanitizeString)
    .pipe(z.string().max(maxLen, `Must not exceed ${maxLen} characters`));

const cleanOptionalString = (maxLen) =>
  z
    .string()
    .optional()
    .default("")
    .transform(sanitizeString)
    .pipe(z.string().max(maxLen, `Must not exceed ${maxLen} characters`));

export const resumeDraftSchema = z.object({
  template: z.enum(["classic", "modern"]).default("classic"),
  fullName: cleanOptionalString(100),
  headline: cleanOptionalString(150),
  contact: z
    .object({
      email: cleanOptionalString(120),
      phone: cleanOptionalString(30),
      city: cleanOptionalString(100),
      linkedin: cleanOptionalString(300),
      github: cleanOptionalString(300),
      portfolio: cleanOptionalString(300),
    })
    .default({}),
  summary: cleanOptionalString(400),
  skills: z
    .array(
      z.object({
        category: cleanOptionalString(60),
        items: z.array(cleanString(50)).max(30, "Max 30 skills per category").default([]),
      })
    )
    .max(10, "Maximum 10 skill categories allowed")
    .default([]),
  education: z
    .array(
      z.object({
        degree: cleanOptionalString(150),
        institute: cleanOptionalString(200),
        startYear: z.number().int().min(1950).max(2100).nullable().optional(),
        endYear: z.number().int().min(1950).max(2100).nullable().optional(),
        grade: cleanOptionalString(50),
      })
    )
    .max(6, "Maximum 6 education entries allowed")
    .default([]),
  projects: z
    .array(
      z.object({
        name: cleanOptionalString(150),
        techStack: z.array(cleanString(50)).max(15, "Max 15 tech items").default([]),
        link: cleanOptionalString(300),
        bullets: z
          .array(cleanString(220))
          .max(5, "Maximum 5 bullets per project")
          .default([]),
      })
    )
    .max(8, "Maximum 8 projects allowed")
    .default([]),
  experience: z
    .array(
      z.object({
        role: cleanOptionalString(150),
        company: cleanOptionalString(150),
        startDate: cleanOptionalString(50),
        endDate: cleanOptionalString(50),
        current: z.boolean().default(false),
        bullets: z
          .array(cleanString(220))
          .max(5, "Maximum 5 bullets per experience entry")
          .default([]),
      })
    )
    .max(6, "Maximum 6 experience items allowed")
    .default([]),
  certifications: z
    .array(
      z.object({
        name: cleanOptionalString(150),
        issuer: cleanOptionalString(150),
        year: z.number().int().min(1950).max(2100).nullable().optional(),
      })
    )
    .max(10, "Maximum 10 certifications allowed")
    .default([]),
  sectionOrder: z
    .array(z.string())
    .default(["summary", "skills", "projects", "experience", "education", "certifications"]),
});
