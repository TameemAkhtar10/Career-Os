import { apiClient } from "../../../config/api";
import { ApiResponse } from "../../../types/api";
import { CandidateDashboardData } from "../types";

export const candidateDashboardApi = {
  getDashboard: (): Promise<ApiResponse<CandidateDashboardData>> =>
    apiClient<CandidateDashboardData>("/api/candidate/dashboard", {
      method: "GET",
    }),
};

