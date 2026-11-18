"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { savedJobsApi } from "../services/savedJobs.api";
import { SavedJobsResponseData } from "../../../types/job";
import { useAuth } from "../../../providers/AuthProvider";
import { toast } from "sonner";

export const useSavedJobIds = () => {
  const { user, isAuthenticated } = useAuth();
  const isCandidate = isAuthenticated && user?.role === "candidate";

  return useQuery({
    queryKey: ["saved-jobs", "ids"],
    queryFn: async () => {
      const res = await savedJobsApi.getSavedJobIds();
      return res.data || [];
    },
    enabled: isCandidate,
    staleTime: 60 * 1000,
  });
};

export const useSavedJobsList = (page = 1, limit = 10) => {
  const { user, isAuthenticated } = useAuth();
  const isCandidate = isAuthenticated && user?.role === "candidate";

  return useQuery({
    queryKey: ["saved-jobs", "list", page, limit],
    queryFn: async () => {
      const res = await savedJobsApi.getSavedJobs({ page, limit });
      return res.data;
    },
    enabled: isCandidate,
    placeholderData: (prev) => prev,
  });
};

export const useToggleSaveJob = () => {
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();

  return useMutation({
    mutationFn: async ({ jobId, isSaved }: { jobId: string; isSaved: boolean }) => {
      if (isSaved) {
        return savedJobsApi.unsaveJob(jobId);
      } else {
        return savedJobsApi.saveJob(jobId);
      }
    },
    onMutate: async ({ jobId, isSaved }) => {
      await queryClient.cancelQueries({ queryKey: ["saved-jobs", "ids"] });
      const previousIds = queryClient.getQueryData<string[]>(["saved-jobs", "ids"]) || [];

      // Optimistically update the IDs array
      const nextIds = isSaved
        ? previousIds.filter((id) => id !== jobId)
        : [...previousIds, jobId];

      queryClient.setQueryData(["saved-jobs", "ids"], nextIds);

      return { previousIds };
    },
    onError: (err: any, _vars, context) => {
      if (context?.previousIds) {
        queryClient.setQueryData(["saved-jobs", "ids"], context.previousIds);
      }
      const msg = err?.response?.data?.message || err?.message || "Failed to update saved job.";
      toast.error(msg);
    },
    onSuccess: (_res, { isSaved }) => {
      if (isSaved) {
        toast.success("Job removed from saved jobs");
      } else {
        toast.success("Job saved to your bookmarks");
      }
      queryClient.invalidateQueries({ queryKey: ["saved-jobs"] });
    },
  });
};
