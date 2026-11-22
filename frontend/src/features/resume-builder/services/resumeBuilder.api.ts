import { apiClient } from "../../../config/api";
import { ApiResponse } from "../../../types/api";
import { ResumeDraftData, QualityCheckResult } from "../types/resumeBuilder.types";

/** Shape of GET /api/resume-builder response data */
export interface ResumeDraftResponse {
  draft: ResumeDraftData;
  isPrefill: boolean;
}

export const resumeBuilderApi = {
  getDraft: (): Promise<ApiResponse<ResumeDraftResponse>> =>
    apiClient<ResumeDraftResponse>("/api/resume-builder", {
      method: "GET",
    }),

  saveDraft: (data: ResumeDraftData): Promise<ApiResponse<ResumeDraftResponse>> =>
    apiClient<ResumeDraftResponse>("/api/resume-builder", {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  downloadPdf: async (
    data?: ResumeDraftData
  ): Promise<{ blob: Blob; pageCount: number }> => {
    const res = await fetch("/api/resume-builder/pdf", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(data || {}),
    });

    if (!res.ok) {
      let errorMsg = "Failed to generate PDF";
      try {
        const errJson = await res.json();
        if (errJson.message) errorMsg = errJson.message;
      } catch {
        // fallback to statusText
      }
      throw new Error(errorMsg);
    }

    const pageCount = parseInt(res.headers.get("X-Resume-Pages") || "1", 10);
    const blob = await res.blob();
    return { blob, pageCount };
  },

  useAsResume: (
    data?: ResumeDraftData
  ): Promise<
    ApiResponse<{
      message: string;
      fileName: string;
      size: number;
    }>
  > =>
    apiClient<{
      message: string;
      fileName: string;
      size: number;
    }>("/api/resume-builder/use-as-resume", {
      method: "POST",
      body: JSON.stringify(data || {}),
    }),

  deleteDraft: (): Promise<ApiResponse<null>> =>
    apiClient<null>("/api/resume-builder", {
      method: "DELETE",
    }),

  /**
   * POST /api/resume-builder/check
   * Backend returns: { score, grade, subScores, topIssues, pageCount }
   */
  checkQuality: (
    data?: ResumeDraftData
  ): Promise<ApiResponse<QualityCheckResult>> =>
    apiClient<QualityCheckResult>("/api/resume-builder/check", {
      method: "POST",
      body: JSON.stringify(data || {}),
    }),
};
