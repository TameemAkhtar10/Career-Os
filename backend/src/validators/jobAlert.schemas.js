import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const jobAlertFiltersSchema = z.object({
  q: z.string().max(100).optional().default(""),
  skills: z.array(z.string().max(50)).optional().default([]),
  location: z.string().max(100).optional().default(""),
  workMode: z.enum(["", "onsite", "remote", "hybrid"]).optional().default(""),
  jobType: z.enum(["", "full_time", "internship", "part_time", "contract"]).optional().default(""),
  fresher: z.boolean().optional().default(false),
  minSalary: z.number().nullable().optional().default(null),
});

export const createJobAlertSchema = z.object({
  name: z
    .string({ required_error: "Alert name is required" })
    .trim()
    .min(1, "Alert name cannot be empty")
    .max(100, "Alert name cannot exceed 100 characters"),
  filters: jobAlertFiltersSchema.optional().default({}),
  frequency: z.enum(["daily", "weekly"]).optional().default("daily"),
});

export const updateJobAlertSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  filters: jobAlertFiltersSchema.optional(),
  frequency: z.enum(["daily", "weekly"]).optional(),
  active: z.boolean().optional(),
});

export const jobAlertParamSchema = z.object({
  id: z
    .string({ required_error: "Alert ID is required" })
    .regex(objectIdRegex, "Invalid alert ID format"),
});
