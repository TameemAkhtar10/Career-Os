import { z } from "zod";

export const jobFormSchema = z
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
    city: z.string().trim().max(100, "City cannot exceed 100 characters").optional().default(""),
    state: z.string().trim().max(100, "State cannot exceed 100 characters").optional().default(""),
    workMode: z.enum(["onsite", "remote", "hybrid"], {
      errorMap: () => ({ message: "Select a work mode" }),
    }),
    jobType: z.enum(["full_time", "internship", "part_time", "contract"], {
      errorMap: () => ({ message: "Select a job type" }),
    }),
    minYears: z.coerce
      .number()
      .int()
      .min(0, "Min experience must be 0 or more"),
    maxYears: z.coerce
      .number()
      .int()
      .min(0, "Max experience must be 0 or more"),
    salaryMinLpa: z.preprocess(
      (v) => (v === "" || v === null || v === undefined ? null : Number(v)),
      z.number().min(0, "Salary cannot be negative").nullable().optional()
    ),
    salaryMaxLpa: z.preprocess(
      (v) => (v === "" || v === null || v === undefined ? null : Number(v)),
      z.number().min(0, "Salary cannot be negative").nullable().optional()
    ),
    salaryIsVisible: z.boolean().default(true),
    skills: z
      .array(z.string().trim().min(1).max(50))
      .max(20, "Skills list cannot exceed 20 skills")
      .default([]),
    openings: z.coerce
      .number()
      .int()
      .min(1, "Openings must be at least 1")
      .default(1),
    applicationDeadline: z
      .string()
      .nullable()
      .optional()
      .refine(
        (val) => {
          if (!val) return true;
          const d = new Date(val);
          return !isNaN(d.getTime()) && d.getTime() > Date.now();
        },
        { message: "Application deadline must be a future date" }
      ),
    status: z.enum(["draft", "open", "closed"]).default("open"),
  })
  .refine(
    (data) => data.maxYears >= data.minYears,
    {
      message: "Max experience must be greater than or equal to min experience",
      path: ["maxYears"],
    }
  )
  .refine(
    (data) => {
      if (data.salaryMinLpa != null && data.salaryMaxLpa != null) {
        return data.salaryMaxLpa >= data.salaryMinLpa;
      }
      return true;
    },
    {
      message: "Max salary must be greater than or equal to min salary",
      path: ["salaryMaxLpa"],
    }
  );

export type JobFormValues = z.infer<typeof jobFormSchema>;

