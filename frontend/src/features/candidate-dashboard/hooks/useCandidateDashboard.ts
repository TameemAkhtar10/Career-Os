import { useQuery } from "@tanstack/react-query";
import { candidateDashboardApi } from "../services/dashboard.api";

export function useCandidateDashboard() {
  return useQuery({
    queryKey: ["candidate", "dashboard"],
    queryFn: async () => {
      const res = await candidateDashboardApi.getDashboard();
      return res.data;
    },
    staleTime: 30 * 1000, // 30s
  });
}

