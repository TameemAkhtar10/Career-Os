import { apiClient } from "../../../config/api";
import { ApiResponse } from "../../../types/api";
import { JobAlert, JobAlertFilters } from "../../../types/job";

export interface CreateJobAlertDto {
  name: string;
  filters?: JobAlertFilters;
  frequency?: "daily" | "weekly";
}

export interface UpdateJobAlertDto {
  name?: string;
  filters?: JobAlertFilters;
  frequency?: "daily" | "weekly";
  active?: boolean;
}

export const jobAlertsApi = {
  getMyAlerts: (): Promise<ApiResponse<JobAlert[]>> =>
    apiClient<JobAlert[]>("/api/job-alerts", {
      method: "GET",
    }),

  createAlert: (data: CreateJobAlertDto): Promise<ApiResponse<JobAlert>> =>
    apiClient<JobAlert>("/api/job-alerts", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateAlert: (id: string, data: UpdateJobAlertDto): Promise<ApiResponse<JobAlert>> =>
    apiClient<JobAlert>(`/api/job-alerts/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  deleteAlert: (id: string): Promise<ApiResponse<{ deleted: boolean; id: string }>> =>
    apiClient<{ deleted: boolean; id: string }>(`/api/job-alerts/${id}`, {
      method: "DELETE",
    }),

  pauseAlertWithToken: (token: string): Promise<ApiResponse<{ paused: boolean; alertId: string; name: string }>> =>
    apiClient<{ paused: boolean; alertId: string; name: string }>("/api/job-alerts/pause", {
      method: "POST",
      body: JSON.stringify({ token }),
    }),
};
