import { z } from "zod";

/**
 * Validates an optional URL string:
 * - Allows empty string "" or undefined
 * - If provided, must begin with http:// or https:// and be a valid URL
 */
const optionalUrl = (max = 500) =>
  z
    .string()
    .trim()
    .max(max, `URL cannot exceed ${max} characters`)
    .refine(
      (val) => {
        if (!val) return true;
        try {
          const u = new URL(val);
          return u.protocol === "http:" || u.protocol === "https:";
        } catch {
          return false;
        }
      },
      { message: "Must be a valid URL starting with http:// or https://" }
    )
    .optional()
    .default("");

const optionalDate = z.preprocess((val) => {
  if (val === "" || val === null || val === undefined) return null;
  return val;
}, z.coerce.date().nullable().optional());

export const candidateProfileSchema = z.object({
  headline: z
    .string()
    .trim()
    .max(150, "Headline cannot exceed 150 characters")
    .optional()
    .default(""),
  about: z
    .string()
    .trim()
    .max(3000, "About section cannot exceed 3000 characters")
    .optional()
    .default(""),
  phone: z
    .string()
    .trim()
    .max(25, "Phone number cannot exceed 25 characters")
    .optional()
    .default(""),
  location: z
    .object({
      city: z.string().trim().max(100, "City cannot exceed 100 characters").optional().default(""),
      state: z.string().trim().max(100, "State cannot exceed 100 characters").optional().default(""),
    })
    .optional()
    .default({}),
  education: z
    .array(
      z.object({
        degree: z
          .string()
          .trim()
          .min(1, "Degree is required")
          .max(150, "Degree cannot exceed 150 characters"),
        institute: z
          .string()
          .trim()
          .min(1, "Institute is required")
          .max(200, "Institute cannot exceed 200 characters"),
        year: z.preprocess(
          (val) => (val === "" || val === null || val === undefined ? null : Number(val)),
          z
            .number()
            .int()
            .min(1950, "Year must be 1950 or later")
            .max(2100, "Year cannot exceed 2100")
            .nullable()
            .optional()
        ),
        grade: z.string().trim().max(50, "Grade cannot exceed 50 characters").optional().default(""),
      })
    )
    .max(20, "Education entries cannot exceed 20")
    .optional()
    .default([]),
  skills: z
    .array(
      z
        .string()
        .trim()
        .min(1, "Skill cannot be empty")
        .max(50, "Skill name cannot exceed 50 characters")
    )
    .max(30, "Skills list cannot exceed 30 skills")
    .optional()
    .default([]),
  experience: z
    .array(
      z.object({
        title: z
          .string()
          .trim()
          .min(1, "Job title is required")
          .max(150, "Job title cannot exceed 150 characters"),
        company: z
          .string()
          .trim()
          .min(1, "Company name is required")
          .max(150, "Company name cannot exceed 150 characters"),
        from: optionalDate,
        to: optionalDate,
        description: z
          .string()
          .trim()
          .max(2500, "Description cannot exceed 2500 characters")
          .optional()
          .default(""),
      })
    )
    .max(30, "Experience entries cannot exceed 30")
    .optional()
    .default([]),
  projects: z
    .array(
      z.object({
        title: z
          .string()
          .trim()
          .min(1, "Project title is required")
          .max(150, "Project title cannot exceed 150 characters"),
        description: z
          .string()
          .trim()
          .max(2000, "Description cannot exceed 2000 characters")
          .optional()
          .default(""),
        link: optionalUrl(500),
        techStack: z
          .array(
            z
              .string()
              .trim()
              .max(50, "Tech stack item cannot exceed 50 characters")
          )
          .max(20, "Tech stack items cannot exceed 20")
          .optional()
          .default([]),
      })
    )
    .max(30, "Projects cannot exceed 30")
    .optional()
    .default([]),
  links: z
    .object({
      github: optionalUrl(500),
      linkedin: optionalUrl(500),
      portfolio: optionalUrl(500),
    })
    .optional()
    .default({}),
  resumeUrl: optionalUrl(1000),
  openToWork: z.boolean().optional().default(true),
  expectedRole: z
    .string()
    .trim()
    .max(100, "Expected role cannot exceed 100 characters")
    .optional()
    .default(""),
});

export const recruiterProfileSchema = z.object({
  companyName: z
    .string()
    .trim()
    .min(1, "Company name is required")
    .max(150, "Company name cannot exceed 150 characters"),
  companyWebsite: optionalUrl(500),
  companyLogoUrl: optionalUrl(1000),
  industry: z
    .string()
    .trim()
    .max(100, "Industry cannot exceed 100 characters")
    .optional()
    .default(""),
  companySize: z
    .string()
    .trim()
    .max(50, "Company size cannot exceed 50 characters")
    .optional()
    .default(""),
  about: z
    .string()
    .trim()
    .max(3000, "About section cannot exceed 3000 characters")
    .optional()
    .default(""),
  location: z
    .string()
    .trim()
    .max(150, "Location cannot exceed 150 characters")
    .optional()
    .default(""),
  designation: z
    .string()
    .trim()
    .max(100, "Designation cannot exceed 100 characters")
    .optional()
    .default(""),
});
