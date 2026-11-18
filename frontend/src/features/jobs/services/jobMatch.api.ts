import { apiClient } from "../../../config/api";
import { ApiResponse } from "../../../types/api";
import { JobMatchData } from "../../../types/job";

export const jobMatchApi = {
  getJobMatch: (jobId: string): Promise<ApiResponse<JobMatchData>> =>
    apiClient<JobMatchData>(`/api/jobs/${jobId}/match`, {
      method: "GET",
    }),
};
