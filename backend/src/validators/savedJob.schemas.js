import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const saveJobParamSchema = z.object({
  jobId: z
    .string({ required_error: "Job ID is required" })
    .regex(objectIdRegex, "Invalid job ID format"),
});
