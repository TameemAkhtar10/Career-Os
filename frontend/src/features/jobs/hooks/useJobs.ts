"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { jobsApi } from "../services/jobs.api";
import { Job, JobsQueryParams, JobsResponseData } from "../../../types/job";
import { toast } from "sonner";

export const usePublicJobs = (params: JobsQueryParams, initialData?: JobsResponseData) => {
  return useQuery({
    queryKey: ["jobs", "public", params],
    queryFn: async () => {
      const res = await jobsApi.getPublicJobs(params);
      return res.data;
    },
    initialData: initialData && Object.keys(params).length === 0 ? initialData : undefined,
    placeholderData: (previousData) => previousData,
  });
};

export const useJobDetail = (id: string, initialData?: Job) => {
  return useQuery({
    queryKey: ["jobs", "detail", id],
    queryFn: async () => {
      const res = await jobsApi.getJobById(id);
      return res.data;
    },
    initialData,
    enabled: Boolean(id),
  });
};

export const useMyJobs = (params: { status?: string; page?: number; limit?: number } = {}) => {
  return useQuery({
    queryKey: ["jobs", "mine", params],
    queryFn: async () => {
      const res = await jobsApi.getMyJobs(params);
      return res.data;
    },
  });
};

export const useCreateJob = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => jobsApi.createJob(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs", "mine"] });
      queryClient.invalidateQueries({ queryKey: ["jobs", "public"] });
      toast.success("Job posted successfully!");
    },
  });
};

export const useUpdateJob = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => jobsApi.updateJob(id, data),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["jobs", "mine"] });
      queryClient.invalidateQueries({ queryKey: ["jobs", "detail", vars.id] });
      queryClient.invalidateQueries({ queryKey: ["jobs", "public"] });
      toast.success("Job updated successfully!");
    },
  });
};

export const useUpdateJobStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: "draft" | "open" | "closed" }) =>
      jobsApi.updateJobStatus(id, status),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["jobs", "mine"] });
      queryClient.invalidateQueries({ queryKey: ["jobs", "detail", vars.id] });
      queryClient.invalidateQueries({ queryKey: ["jobs", "public"] });
      toast.success(`Job status updated to ${vars.status}.`);
    },
  });
};

export const useDeleteJob = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => jobsApi.deleteJob(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs", "mine"] });
      queryClient.invalidateQueries({ queryKey: ["jobs", "public"] });
      toast.success("Job closed successfully.");
    },
  });
};

export const useApplyJob = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ jobId, coverNote }: { jobId: string; coverNote?: string }) =>
      jobsApi.applyToJob(jobId, coverNote),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications", "mine"] });
    },
  });
};
