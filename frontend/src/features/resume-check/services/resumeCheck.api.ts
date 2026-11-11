import { apiClient } from "../../../config/api";
import { ApiResponse } from "../../../types/api";
import {
  ResumeAnalysis,
  ResumeAnalysisSummary,
  AnalyzeResumeRequest,
} from "../types";

export const resumeCheckApi = {
  analyzeResume: (
    payload: AnalyzeResumeRequest
  ): Promise<ApiResponse<ResumeAnalysis>> =>
    apiClient<ResumeAnalysis>("/api/resume/analyze", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getAnalyses: (
    page: number = 1,
    limit: number = 10
  ): Promise<
    ApiResponse<{
      analyses: ResumeAnalysisSummary[];
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    }>
  > =>
    apiClient<{
      analyses: ResumeAnalysisSummary[];
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    }>(`/api/resume/analyses?page=${page}&limit=${limit}`, {
      method: "GET",
    }),

  getAnalysisById: (id: string): Promise<ApiResponse<ResumeAnalysis>> =>
    apiClient<ResumeAnalysis>(`/api/resume/analyses/${id}`, {
      method: "GET",
    }),

  deleteAnalysis: (id: string): Promise<ApiResponse<null>> =>
    apiClient<null>(`/api/resume/analyses/${id}`, {
      method: "DELETE",
    }),

  deleteAllAnalyses: (): Promise<ApiResponse<{ deletedCount: number }>> =>
    apiClient<{ deletedCount: number }>("/api/resume/analyses", {
      method: "DELETE",
    }),

  withdrawConsent: (): Promise<ApiResponse<null>> =>
    apiClient<null>("/api/resume/consent", {
      method: "DELETE",
    }),
};
