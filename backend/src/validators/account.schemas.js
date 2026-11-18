import { z } from "zod";

export const deleteAccountSchema = z
  .object({
    password: z.string().optional(),
    confirmEmail: z.string().optional(),
  })
  .refine((data) => Boolean(data.password || data.confirmEmail), {
    message: "Password or confirmation email is required to confirm account deletion.",
  });

export const updateNotificationPreferencesSchema = z
  .object({
    jobAlerts: z.boolean({ invalid_type_error: "jobAlerts must be a boolean" }).optional(),
    applicantDigest: z.boolean({ invalid_type_error: "applicantDigest must be a boolean" }).optional(),
    profileNudges: z.boolean({ invalid_type_error: "profileNudges must be a boolean" }).optional(),
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    "At least one notification preference must be specified."
  );

