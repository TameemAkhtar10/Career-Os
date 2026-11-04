import { apiClient } from "../../../config/api";
import { ApiResponse } from "../../../types/api";
import { User } from "../../../types/user";
import {
  ForgotPasswordFormData,
  LoginFormData,
  RegisterFormData,
  ResetPasswordFormData,
  VerifyEmailFormData,
} from "../schemas";

export const authApi = {
  register: (data: RegisterFormData): Promise<ApiResponse<null>> =>
    apiClient<null>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
      skipAuthRefresh: true,
    }),

  verifyEmail: (data: VerifyEmailFormData): Promise<ApiResponse<{ user: User }>> =>
    apiClient<{ user: User }>("/api/auth/verify-email", {
      method: "POST",
      body: JSON.stringify(data),
      skipAuthRefresh: true,
    }),

  resendOtp: (email: string): Promise<ApiResponse<null>> =>
    apiClient<null>("/api/auth/resend-otp", {
      method: "POST",
      body: JSON.stringify({ email }),
      skipAuthRefresh: true,
    }),

  login: (data: LoginFormData): Promise<ApiResponse<{ user: User }>> =>
    apiClient<{ user: User }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
      skipAuthRefresh: true,
    }),

  refresh: (): Promise<ApiResponse<null>> =>
    apiClient<null>("/api/auth/refresh", {
      method: "POST",
      skipAuthRefresh: true,
    }),

  logout: (): Promise<ApiResponse<null>> =>
    apiClient<null>("/api/auth/logout", {
      method: "POST",
      skipAuthRefresh: true,
    }),

  forgotPassword: (data: ForgotPasswordFormData): Promise<ApiResponse<null>> =>
    apiClient<null>("/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify(data),
      skipAuthRefresh: true,
    }),

  resetPassword: (data: ResetPasswordFormData): Promise<ApiResponse<null>> =>
    apiClient<null>("/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify(data),
      skipAuthRefresh: true,
    }),

  getMe: (): Promise<ApiResponse<User>> =>
    apiClient<User>("/api/auth/me", {
      method: "GET",
    }),
};

