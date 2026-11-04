import { apiClient } from "../../../config/api";
import { ApiResponse } from "../../../types/api";
import { Application, ApplicationsResponseData } from "../../../types/application";

export const applicationsApi = {
  getMyApplications: (params: {
    status?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<ApiResponse<ApplicationsResponseData>> => {
    const searchParams = new URLSearchParams();
    if (params.status) searchParams.set("status", params.status);
    if (params.page) searchParams.set("page", String(params.page));
    if (params.limit) searchParams.set("limit", String(params.limit));

    const qs = searchParams.toString();
    return apiClient<ApplicationsResponseData>(`/api/applications/mine${qs ? `?${qs}` : ""}`, {
      method: "GET",
    });
  },

  withdrawApplication: (id: string): Promise<ApiResponse<Application>> =>
    apiClient<Application>(`/api/applications/${id}/withdraw`, {
      method: "PATCH",
    }),

  getJobApplications: (
    jobId: string,
    params: {
      status?: string;
      minScore?: number;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<ApiResponse<ApplicationsResponseData>> => {
    const searchParams = new URLSearchParams();
    if (params.status) searchParams.set("status", params.status);
    if (params.minScore != null) searchParams.set("minScore", String(params.minScore));
    if (params.page) searchParams.set("page", String(params.page));
    if (params.limit) searchParams.set("limit", String(params.limit));

    const qs = searchParams.toString();
    return apiClient<ApplicationsResponseData>(
      `/api/jobs/${jobId}/applications${qs ? `?${qs}` : ""}`,
      { method: "GET" }
    );
  },

  updateApplicationStatus: (
    id: string,
    status: "shortlisted" | "rejected" | "hired",
    recruiterNote?: string
  ): Promise<ApiResponse<Application>> =>
    apiClient<Application>(`/api/applications/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status, recruiterNote }),
    }),
};

