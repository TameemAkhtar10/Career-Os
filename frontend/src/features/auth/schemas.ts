import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[a-zA-Z]/, "Password must contain at least one letter")
  .regex(/[0-9]/, "Password must contain at least one number");

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Please enter a valid email address");

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").trim(),
  email: emailSchema,
  password: passwordSchema,
  role: z.enum(["candidate", "recruiter"], {
    errorMap: () => ({ message: "Role must be 'candidate' or 'recruiter'" }),
  }),
});

export const verifyEmailSchema = z.object({
  email: emailSchema,
  otp: z
    .string()
    .length(6, "OTP must be exactly 6 digits")
    .regex(/^\d{6}$/, "OTP must contain only numbers"),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  email: emailSchema,
  otp: z
    .string()
    .length(6, "OTP must be exactly 6 digits")
    .regex(/^\d{6}$/, "OTP must contain only numbers"),
  newPassword: passwordSchema,
});

export type RegisterFormData = z.infer<typeof registerSchema>;
export type VerifyEmailFormData = z.infer<typeof verifyEmailSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

