import { apiClient } from "../../../config/api";
import { ApiResponse } from "../../../types/api";
import {
  AdminStats,
  AdminUsersResponse,
  AdminJobsResponse,
  AdminAuditLogsResponse,
  AdminCronRunsResponse,
} from "../../../types/admin";

export const adminApi = {
  getStats: (): Promise<ApiResponse<AdminStats>> =>
    apiClient("/api/admin/stats", { method: "GET" }),

  getUsers: (params: {
    role?: string;
    status?: string;
    q?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<AdminUsersResponse>> => {
    const qs = new URLSearchParams();
    if (params.role) qs.set("role", params.role);
    if (params.status) qs.set("status", params.status);
    if (params.q) qs.set("q", params.q);
    if (params.page) qs.set("page", String(params.page));
    if (params.limit) qs.set("limit", String(params.limit));
    const q = qs.toString();
    return apiClient(`/api/admin/users${q ? `?${q}` : ""}`, { method: "GET" });
  },

  updateUserStatus: (
    id: string,
    status: "active" | "suspended"
  ): Promise<ApiResponse<unknown>> =>
    apiClient(`/api/admin/users/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  verifyRecruiter: (
    userId: string,
    isVerified: boolean
  ): Promise<ApiResponse<{ userId: string; isVerified: boolean }>> =>
    apiClient(`/api/admin/recruiters/${userId}/verify`, {
      method: "PATCH",
      body: JSON.stringify({ isVerified }),
    }),

  getJobs: (params: {
    status?: string;
    q?: string;
    recruiterId?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<AdminJobsResponse>> => {
    const qs = new URLSearchParams();
    if (params.status) qs.set("status", params.status);
    if (params.q) qs.set("q", params.q);
    if (params.recruiterId) qs.set("recruiterId", params.recruiterId);
    if (params.page) qs.set("page", String(params.page));
    if (params.limit) qs.set("limit", String(params.limit));
    const q = qs.toString();
    return apiClient(`/api/admin/jobs${q ? `?${q}` : ""}`, { method: "GET" });
  },

  updateJobStatus: (
    id: string,
    status: "open" | "closed" | "draft"
  ): Promise<ApiResponse<unknown>> =>
    apiClient(`/api/admin/jobs/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  getAuditLogs: (params: {
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<AdminAuditLogsResponse>> => {
    const qs = new URLSearchParams();
    if (params.page) qs.set("page", String(params.page));
    if (params.limit) qs.set("limit", String(params.limit));
    const q = qs.toString();
    return apiClient(`/api/admin/audit-logs${q ? `?${q}` : ""}`, { method: "GET" });
  },

  getCronRuns: (params: {
    page?: number;
    limit?: number;
    task?: string;
  }): Promise<ApiResponse<AdminCronRunsResponse>> => {
    const qs = new URLSearchParams();
    if (params.page) qs.set("page", String(params.page));
    if (params.limit) qs.set("limit", String(params.limit));
    if (params.task) qs.set("task", params.task);
    const q = qs.toString();
    return apiClient(`/api/admin/cron-runs${q ? `?${q}` : ""}`, { method: "GET" });
  },

  triggerCronTask: (
    task: string,
    dryRun: boolean
  ): Promise<ApiResponse<unknown>> =>
    apiClient(`/api/admin/cron/${task}/run`, {
      method: "POST",
      body: JSON.stringify({ dryRun }),
    }),
};

