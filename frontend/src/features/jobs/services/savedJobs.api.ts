import { apiClient } from "../../../config/api";
import { ApiResponse } from "../../../types/api";
import { SavedJobsResponseData } from "../../../types/job";

export const savedJobsApi = {
  getSavedJobIds: (): Promise<ApiResponse<string[]>> =>
    apiClient<string[]>("/api/saved-jobs/ids", {
      method: "GET",
    }),

  getSavedJobs: (params: { page?: number; limit?: number } = {}): Promise<ApiResponse<SavedJobsResponseData>> => {
    const sp = new URLSearchParams();
    if (params.page) sp.set("page", String(params.page));
    if (params.limit) sp.set("limit", String(params.limit));
    return apiClient<SavedJobsResponseData>(`/api/saved-jobs?${sp.toString()}`, {
      method: "GET",
    });
  },

  saveJob: (jobId: string): Promise<ApiResponse<{ saved: boolean; savedJobId: string }>> =>
    apiClient<{ saved: boolean; savedJobId: string }>(`/api/saved-jobs/${jobId}`, {
      method: "POST",
    }),

  unsaveJob: (jobId: string): Promise<ApiResponse<{ saved: boolean }>> =>
    apiClient<{ saved: boolean }>(`/api/saved-jobs/${jobId}`, {
      method: "DELETE",
    }),
};
