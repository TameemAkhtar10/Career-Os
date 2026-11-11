import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { resumeCheckApi } from "../services/resumeCheck.api";
import { AnalyzeResumeRequest } from "../types";
import { toast } from "sonner";
import { ApiClientError } from "../../../config/api";

export const RESUME_CHECK_KEYS = {
  all: ["resume-check"] as const,
  analyses: (page: number) => ["resume-check", "analyses", page] as const,
  detail: (id: string) => ["resume-check", "detail", id] as const,
};

export function useResumeAnalyses(page: number = 1) {
  return useQuery({
    queryKey: RESUME_CHECK_KEYS.analyses(page),
    queryFn: async () => {
      const res = await resumeCheckApi.getAnalyses(page, 15);
      return res.data;
    },
  });
}

export function useResumeAnalysisDetail(id?: string) {
  return useQuery({
    queryKey: RESUME_CHECK_KEYS.detail(id || ""),
    queryFn: async () => {
      if (!id) return null;
      const res = await resumeCheckApi.getAnalysisById(id);
      return res.data;
    },
    enabled: Boolean(id),
  });
}

export function useAnalyzeResumeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: AnalyzeResumeRequest) => {
      const res = await resumeCheckApi.analyzeResume(payload);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: RESUME_CHECK_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ["candidate", "dashboard"] });
      if (data?.cached) {
        toast.info("Showing your saved analysis result.");
      } else {
        toast.success("Resume analysis complete!");
      }
    },
  });
}

export function useDeleteAnalysisMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await resumeCheckApi.deleteAnalysis(id);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RESUME_CHECK_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ["candidate", "dashboard"] });
      toast.success("Analysis deleted.");
    },
    onError: (err: any) => {
      if (err instanceof ApiClientError) {
        toast.error(err.message);
      } else {
        toast.error("Failed to delete analysis.");
      }
    },
  });
}

export function useClearAllAnalysesMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await resumeCheckApi.deleteAllAnalyses();
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: RESUME_CHECK_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ["candidate", "dashboard"] });
      const count = data?.deletedCount ?? 0;
      toast.success(
        count === 1 ? "1 scan deleted." : `${count} scans deleted.`
      );
    },
    onError: (err: any) => {
      if (err instanceof ApiClientError) {
        toast.error(err.message);
      } else {
        toast.error("Failed to clear scan history.");
      }
    },
  });
}

export function useWithdrawConsentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await resumeCheckApi.withdrawConsent();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RESUME_CHECK_KEYS.all });
      toast.success("AI resume analysis consent has been withdrawn.");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to withdraw consent.");
    },
  });
}
