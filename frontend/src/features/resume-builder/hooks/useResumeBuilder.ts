import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { resumeBuilderApi } from "../services/resumeBuilder.api";
import { ResumeDraftData, QualityCheckResult } from "../types/resumeBuilder.types";

export const RESUME_BUILDER_KEYS = {
  draft: ["resume-builder", "draft"] as const,
  quality: ["resume-builder", "quality"] as const,
};

/**
 * Backend returns ApiResponse<{ draft: ResumeDraftData; isPrefill: boolean }>.
 * We unwrap to { draft, isPrefill } so callers access `.draft`.
 */
export function useResumeDraft() {
  return useQuery({
    queryKey: RESUME_BUILDER_KEYS.draft,
    queryFn: async () => {
      const res = await resumeBuilderApi.getDraft();
      // res.data is { draft: ResumeDraftData; isPrefill: boolean }
      return res.data as { draft: ResumeDraftData; isPrefill: boolean } | null;
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useSaveResumeDraft() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ResumeDraftData) => resumeBuilderApi.saveDraft(data),
    onSuccess: (res) => {
      // Server returns { draft: updatedDraft } – update cache with same shape
      queryClient.setQueryData(RESUME_BUILDER_KEYS.draft, res.data);
    },
  });
}

export function useDeleteResumeDraft() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => resumeBuilderApi.deleteDraft(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RESUME_BUILDER_KEYS.draft });
    },
  });
}

export function useUseAsResume() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data?: ResumeDraftData) => resumeBuilderApi.useAsResume(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", "me"] });
      queryClient.invalidateQueries({ queryKey: RESUME_BUILDER_KEYS.draft });
    },
  });
}

export function useCheckResumeQuality() {
  return useMutation({
    mutationFn: (data?: ResumeDraftData) => resumeBuilderApi.checkQuality(data),
  });
}
