import { z } from "zod";

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

export const candidateProfileSchema = z.object({
  headline: z.string().trim().max(150, "Headline cannot exceed 150 characters").optional().default(""),
  about: z.string().trim().max(3000, "About section cannot exceed 3000 characters").optional().default(""),
  phone: z.string().trim().max(25, "Phone number cannot exceed 25 characters").optional().default(""),
  location: z
    .object({
      city: z.string().trim().max(100).optional().default(""),
      state: z.string().trim().max(100).optional().default(""),
    })
    .optional()
    .default({ city: "", state: "" }),
  education: z
    .array(
      z.object({
        degree: z.string().trim().min(1, "Degree is required").max(150),
        institute: z.string().trim().min(1, "Institute is required").max(200),
        year: z.preprocess(
          (val) => (val === "" || val === null || val === undefined ? null : Number(val)),
          z.number().int().min(1950, "Year must be 1950 or later").max(2100).nullable().optional()
        ),
        grade: z.string().trim().max(50).optional().default(""),
      })
    )
    .max(20)
    .optional()
    .default([]),
  skills: z
    .array(z.string().trim().min(1).max(50))
    .max(30, "Skills list cannot exceed 30 skills")
    .optional()
    .default([]),
  experience: z
    .array(
      z.object({
        title: z.string().trim().min(1, "Job title is required").max(150),
        company: z.string().trim().min(1, "Company name is required").max(150),
        from: z.string().nullable().optional(),
        to: z.string().nullable().optional(),
        description: z.string().trim().max(2500).optional().default(""),
      })
    )
    .max(30)
    .optional()
    .default([]),
  projects: z
    .array(
      z.object({
        title: z.string().trim().min(1, "Project title is required").max(150),
        description: z.string().trim().max(2000).optional().default(""),
        link: optionalUrl(500),
        techStack: z.array(z.string().trim().max(50)).max(20).optional().default([]),
      })
    )
    .max(30)
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
  expectedRole: z.string().trim().max(100).optional().default(""),
});

export const recruiterProfileSchema = z.object({
  companyName: z
    .string()
    .trim()
    .min(1, "Company name is required")
    .max(150, "Company name cannot exceed 150 characters"),
  companyWebsite: optionalUrl(500),
  companyLogoUrl: optionalUrl(1000),
  industry: z.string().trim().max(100).optional().default(""),
  companySize: z.string().trim().max(50).optional().default(""),
  about: z.string().trim().max(3000).optional().default(""),
  location: z.string().trim().max(150).optional().default(""),
  designation: z.string().trim().max(100).optional().default(""),
});

export type CandidateProfileFormData = z.infer<typeof candidateProfileSchema>;
export type RecruiterProfileFormData = z.infer<typeof recruiterProfileSchema>;

