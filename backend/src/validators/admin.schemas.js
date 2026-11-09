import { z } from "zod";

export const updateUserStatusSchema = z.object({
  status: z.enum(["active", "suspended"], {
    errorMap: () => ({ message: "Status must be either 'active' or 'suspended'" }),
  }),
});

export const updateJobStatusSchema = z.object({
  status: z.enum(["open", "closed", "draft"], {
    errorMap: () => ({ message: "Status must be 'open', 'closed', or 'draft'" }),
  }),
});

export const verifyRecruiterSchema = z.object({
  isVerified: z.boolean({
    required_error: "isVerified (boolean) is required",
    invalid_type_error: "isVerified must be a boolean",
  }),
});

export const triggerCronTaskSchema = z.object({
  dryRun: z.boolean({ invalid_type_error: "dryRun must be a boolean" }).optional(),
});
