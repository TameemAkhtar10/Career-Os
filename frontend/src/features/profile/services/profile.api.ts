import { apiClient } from "../../../config/api";
import { ApiResponse } from "../../../types/api";
import { CandidateProfile, RecruiterProfile } from "../../../types/profile";

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
};

