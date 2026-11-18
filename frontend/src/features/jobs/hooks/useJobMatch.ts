"use client";

import { useQuery } from "@tanstack/react-query";
import { jobMatchApi } from "../services/jobMatch.api";
import { useAuth } from "../../../providers/AuthProvider";

export const useJobMatch = (jobId: string, enabled = true) => {
  const { user, isAuthenticated } = useAuth();
  const isCandidate = isAuthenticated && user?.role === "candidate";

  return useQuery({
    queryKey: ["job-match", jobId],
    queryFn: async () => {
      const res = await jobMatchApi.getJobMatch(jobId);
      return res.data;
    },
    enabled: Boolean(jobId) && isCandidate && enabled,
    staleTime: 5 * 60 * 1000, // cached 5 mins in React Query
    retry: false,
  });
};
