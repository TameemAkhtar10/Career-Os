"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { jobAlertsApi, CreateJobAlertDto, UpdateJobAlertDto } from "../services/jobAlerts.api";
import { JobAlert } from "../../../types/job";
import { useAuth } from "../../../providers/AuthProvider";
import { toast } from "sonner";

export const useJobAlerts = () => {
  const { user, isAuthenticated } = useAuth();
  const isCandidate = isAuthenticated && user?.role === "candidate";

  return useQuery({
    queryKey: ["job-alerts"],
    queryFn: async () => {
      const res = await jobAlertsApi.getMyAlerts();
      return res.data || [];
    },
    enabled: isCandidate,
    staleTime: 30 * 1000,
  });
};

export const useCreateJobAlert = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateJobAlertDto) => jobAlertsApi.createAlert(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["job-alerts"] });
      toast.success(res.message || "Job alert created successfully!");
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || "Failed to create job alert.";
      toast.error(msg);
    },
  });
};

export const useUpdateJobAlert = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateJobAlertDto }) =>
      jobAlertsApi.updateAlert(id, data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["job-alerts"] });
      toast.success(res.message || "Job alert updated.");
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || "Failed to update alert.";
      toast.error(msg);
    },
  });
};

export const useDeleteJobAlert = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => jobAlertsApi.deleteAlert(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job-alerts"] });
      toast.success("Job alert deleted.");
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || "Failed to delete alert.";
      toast.error(msg);
    },
  });
};

export const usePauseAlertWithToken = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (token: string) => jobAlertsApi.pauseAlertWithToken(token),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["job-alerts"] });
      toast.success(res.message || "Job alert has been paused.");
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || "Failed to pause alert.";
      toast.error(msg);
    },
  });
};
