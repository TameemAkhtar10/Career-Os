import { z } from "zod";

const password = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[a-zA-Z]/, "Password must contain at least one letter")
  .regex(/[0-9]/, "Password must contain at least one number");

const email = z
  .string()
  .trim()
  .toLowerCase()
  .email("Invalid email address");

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").trim(),
  email,
  password,
  role: z.enum(["candidate", "recruiter"], {
    errorMap: () => ({ message: "Role must be 'candidate' or 'recruiter'" }),
  }).optional().default("candidate"),
});

export const verifyEmailSchema = z.object({
  email,
  otp: z
    .string()
    .length(6, "OTP must be 6 digits")
    .regex(/^\d{6}$/, "OTP must be 6 digits"),
});

export const resendOtpSchema = z.object({ email });

export const loginSchema = z.object({ email, password: z.string().min(1) });

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z.object({
  email,
  otp: z
    .string()
    .length(6, "OTP must be 6 digits")
    .regex(/^\d{6}$/, "OTP must be 6 digits"),
  newPassword: password,
});
