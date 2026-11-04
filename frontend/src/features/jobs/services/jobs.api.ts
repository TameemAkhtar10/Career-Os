import { apiClient } from "../../../config/api";
import { ApiResponse } from "../../../types/api";
import { Job, JobsQueryParams, JobsResponseData } from "../../../types/job";
import { Application } from "../../../types/application";

export const jobsApi = {
  getPublicJobs: (params: JobsQueryParams = {}): Promise<ApiResponse<JobsResponseData>> => {
    const searchParams = new URLSearchParams();
    if (params.q) searchParams.set("q", params.q);
    if (params.city) searchParams.set("city", params.city);
    if (params.workMode) searchParams.set("workMode", params.workMode);
    if (params.jobType) searchParams.set("jobType", params.jobType);
    if (params.skills) searchParams.set("skills", params.skills);
    if (params.fresher) searchParams.set("fresher", String(params.fresher));
    if (params.minSalary != null) searchParams.set("minSalary", String(params.minSalary));
    if (params.sort) searchParams.set("sort", params.sort);
    if (params.page) searchParams.set("page", String(params.page));
    if (params.limit) searchParams.set("limit", String(params.limit));

    const qs = searchParams.toString();
    return apiClient<JobsResponseData>(`/api/jobs${qs ? `?${qs}` : ""}`, {
      method: "GET",
    });
  },

  getJobById: (id: string): Promise<ApiResponse<Job>> =>
    apiClient<Job>(`/api/jobs/${id}`, {
      method: "GET",
    }),

  getMyJobs: (params: {
    status?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<ApiResponse<JobsResponseData>> => {
    const searchParams = new URLSearchParams();
    if (params.status) searchParams.set("status", params.status);
    if (params.page) searchParams.set("page", String(params.page));
    if (params.limit) searchParams.set("limit", String(params.limit));

    const qs = searchParams.toString();
    return apiClient<JobsResponseData>(`/api/jobs/mine${qs ? `?${qs}` : ""}`, {
      method: "GET",
    });
  },

  createJob: (data: any): Promise<ApiResponse<Job>> =>
    apiClient<Job>("/api/jobs", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateJob: (id: string, data: any): Promise<ApiResponse<Job>> =>
    apiClient<Job>(`/api/jobs/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  updateJobStatus: (id: string, status: "draft" | "open" | "closed"): Promise<ApiResponse<Job>> =>
    apiClient<Job>(`/api/jobs/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  deleteJob: (id: string): Promise<ApiResponse<null>> =>
    apiClient<null>(`/api/jobs/${id}`, {
      method: "DELETE",
    }),

  applyToJob: (jobId: string, coverNote?: string): Promise<ApiResponse<Application>> =>
    apiClient<Application>(`/api/jobs/${jobId}/apply`, {
      method: "POST",
      body: JSON.stringify({ coverNote: coverNote || "" }),
    }),
};

