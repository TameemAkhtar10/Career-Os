import { apiClient, ApiClientError } from "../../../config/api";
import { ApiResponse } from "../../../types/api";
import { CandidateProfile, RecruiterProfile } from "../../../types/profile";

const BASE_URL = typeof window === "undefined"
  ? process.env.BACKEND_URL || "http://localhost:3000"
  : "";

export const profileApi = {
  getProfileMe: (): Promise<ApiResponse<CandidateProfile | RecruiterProfile | null>> =>
    apiClient<CandidateProfile | RecruiterProfile | null>("/api/profile/me", {
      method: "GET",
    }),

  updateCandidateProfile: (data: Partial<CandidateProfile>): Promise<ApiResponse<CandidateProfile>> =>
    apiClient<CandidateProfile>("/api/profile/candidate", {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  updateRecruiterProfile: (data: Partial<RecruiterProfile>): Promise<ApiResponse<RecruiterProfile>> =>
    apiClient<RecruiterProfile>("/api/profile/recruiter", {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  getCandidateProfileById: (userId: string): Promise<ApiResponse<CandidateProfile>> =>
    apiClient<CandidateProfile>(`/api/profile/candidate/${userId}`, {
      method: "GET",
    }),

  uploadResume: (
    file: File,
    onProgress?: (pct: number) => void
  ): Promise<ApiResponse<{ resume: { fileName: string; size: number; uploadedAt: string } }>> => {
    const formData = new FormData();
    formData.append("resume", file);

    if (onProgress) {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `${BASE_URL}/api/profile/candidate/resume`);
        xhr.withCredentials = true;

        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            onProgress(Math.round((e.loaded / e.total) * 100));
          }
        });

        xhr.addEventListener("load", () => {
          try {
            const data = JSON.parse(xhr.responseText);
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(data);
            } else {
              reject(new ApiClientError(data?.message || "Upload failed", xhr.status));
            }
          } catch {
            reject(new ApiClientError("Upload failed", xhr.status));
          }
        });

        xhr.addEventListener("error", () => {
          reject(new ApiClientError("Server not reachable. Please check your connection.", 0));
        });

        xhr.send(formData);
      });
    }

    return apiClient<{ resume: { fileName: string; size: number; uploadedAt: string } }>(
      "/api/profile/candidate/resume",
      { method: "POST", body: formData }
    );
  },

  deleteResume: (): Promise<ApiResponse<null>> =>
    apiClient<null>("/api/profile/candidate/resume", { method: "DELETE" }),

  getResumeSignedUrl: (): Promise<ApiResponse<{ url: string; fileName: string; uploadedAt: string }>> =>
    apiClient<{ url: string; fileName: string; uploadedAt: string }>(
      "/api/profile/candidate/resume",
      { method: "GET" }
    ),

  uploadLogo: (file: File): Promise<ApiResponse<{ companyLogoUrl: string }>> => {
    const formData = new FormData();
    formData.append("logo", file);
    return apiClient<{ companyLogoUrl: string }>("/api/profile/recruiter/logo", {
      method: "POST",
      body: formData,
    });
  },
};

