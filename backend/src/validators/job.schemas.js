import { z } from "zod";

const deadlineValidator = z.preprocess((val) => {
  if (val === "" || val === null || val === undefined) return null;
  return val;
}, z.coerce.date().nullable().optional()).refine(
  (date) => {
    if (!date) return true;
    return date.getTime() > Date.now();
  },
  { message: "Application deadline must be in the future" }
);

export const createJobSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(3, "Job title must be at least 3 characters")
      .max(150, "Job title cannot exceed 150 characters"),
    description: z
      .string()
      .trim()
      .min(10, "Job description must be at least 10 characters")
      .max(10000, "Job description cannot exceed 10000 characters"),
    location: z
      .object({
        city: z.string().trim().max(100, "City cannot exceed 100 characters").optional().default(""),
        state: z.string().trim().max(100, "State cannot exceed 100 characters").optional().default(""),
      })
      .optional()
      .default({}),
    workMode: z.enum(["onsite", "remote", "hybrid"], {
      errorMap: () => ({ message: "Work mode must be 'onsite', 'remote', or 'hybrid'" }),
    }),
    jobType: z.enum(["full_time", "internship", "part_time", "contract"], {
      errorMap: () => ({
        message: "Job type must be 'full_time', 'internship', 'part_time', or 'contract'",
      }),
    }),
    experience: z
      .object({
        minYears: z.coerce.number().int().min(0, "Minimum experience must be 0 or more"),
        maxYears: z.coerce.number().int().min(0, "Maximum experience must be 0 or more"),
      })
      .refine((exp) => exp.maxYears >= exp.minYears, {
        message: "Maximum experience must be greater than or equal to minimum experience",
        path: ["maxYears"],
      }),
    salary: z
      .object({
        min: z.coerce.number().min(0, "Minimum salary cannot be negative").nullable().optional(),
        max: z.coerce.number().min(0, "Maximum salary cannot be negative").nullable().optional(),
        currency: z
          .string()
          .trim()
          .toUpperCase()
          .max(10, "Currency code cannot exceed 10 characters")
          .optional()
          .default("INR"),
        isVisible: z.boolean().optional().default(true),
      })
      .optional()
      .default({})
      .refine(
        (sal) => {
          if (sal.min != null && sal.max != null) {
            return sal.max >= sal.min;
          }
          return true;
        },
        {
          message: "Maximum salary must be greater than or equal to minimum salary",
          path: ["max"],
        }
      ),
    skills: z
      .array(
        z
          .string()
          .trim()
          .min(1, "Skill cannot be empty")
          .max(50, "Skill cannot exceed 50 characters")
      )
      .max(20, "Skills list cannot exceed 20 skills")
      .optional()
      .default([]),
    openings: z.coerce
      .number()
      .int()
      .min(1, "Openings must be at least 1")
      .optional()
      .default(1),
    applicationDeadline: deadlineValidator,
    status: z.enum(["draft", "open", "closed"]).optional().default("open"),
  });

export const updateJobSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(3, "Job title must be at least 3 characters")
      .max(150, "Job title cannot exceed 150 characters")
      .optional(),
    description: z
      .string()
      .trim()
      .min(10, "Job description must be at least 10 characters")
      .max(10000, "Job description cannot exceed 10000 characters")
      .optional(),
    location: z
      .object({
        city: z.string().trim().max(100, "City cannot exceed 100 characters").optional(),
        state: z.string().trim().max(100, "State cannot exceed 100 characters").optional(),
      })
      .optional(),
    workMode: z.enum(["onsite", "remote", "hybrid"]).optional(),
    jobType: z.enum(["full_time", "internship", "part_time", "contract"]).optional(),
    experience: z
      .object({
        minYears: z.coerce.number().int().min(0, "Minimum experience must be 0 or more"),
        maxYears: z.coerce.number().int().min(0, "Maximum experience must be 0 or more"),
      })
      .refine((exp) => exp.maxYears >= exp.minYears, {
        message: "Maximum experience must be greater than or equal to minimum experience",
        path: ["maxYears"],
      })
      .optional(),
    salary: z
      .object({
        min: z.coerce.number().min(0).nullable().optional(),
        max: z.coerce.number().min(0).nullable().optional(),
        currency: z.string().trim().toUpperCase().max(10).optional(),
        isVisible: z.boolean().optional(),
      })
      .refine(
        (sal) => {
          if (sal.min != null && sal.max != null) {
            return sal.max >= sal.min;
          }
          return true;
        },
        {
          message: "Maximum salary must be greater than or equal to minimum salary",
          path: ["max"],
        }
      )
      .optional(),
    skills: z
      .array(
        z
          .string()
          .trim()
          .min(1, "Skill cannot be empty")
          .max(50, "Skill cannot exceed 50 characters")
      )
      .max(20, "Skills list cannot exceed 20 skills")
      .optional(),
    openings: z.coerce.number().int().min(1).optional(),
    applicationDeadline: deadlineValidator,
    status: z.enum(["draft", "open", "closed"]).optional(),
  });

export const updateJobStatusSchema = z.object({
  status: z.enum(["draft", "open", "closed"], {
    errorMap: () => ({ message: "Status must be 'draft', 'open', or 'closed'" }),
  }),
});

export const jobIdParamSchema = z.object({
  id: z
    .string()
    .trim()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid job ID"),
});
