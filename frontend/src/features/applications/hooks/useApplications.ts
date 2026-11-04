"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { applicationsApi } from "../services/applications.api";
import { Application, ApplicationsResponseData } from "../../../types/application";
import { toast } from "sonner";

export const useMyApplications = (params: {
  status?: string;
  page?: number;
  limit?: number;
} = {}) => {
  return useQuery({
    queryKey: ["applications", "mine", params],
    queryFn: async () => {
      const res = await applicationsApi.getMyApplications(params);
      return res.data;
    },
    placeholderData: (previousData) => previousData,
  });
};

export const useWithdrawApplication = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => applicationsApi.withdrawApplication(id),
    onMutate: async (id: string) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["applications", "mine"] });

      // Snapshot previous value
      const previousData = queryClient.getQueriesData<ApplicationsResponseData>({
        queryKey: ["applications", "mine"],
      });

      // Optimistically update status to 'withdrawn'
      queryClient.setQueriesData<ApplicationsResponseData>(
        { queryKey: ["applications", "mine"] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            applications: old.applications.map((app) =>
              app._id === id
                ? {
                    ...app,
                    status: "withdrawn",
                    statusHistory: [
                      ...app.statusHistory,
                      { status: "withdrawn", at: new Date().toISOString() },
                    ],
                  }
                : app
            ),
          };
        }
      );

      return { previousData };
    },
    onError: (_err, _id, context) => {
      // Rollback on error
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast.error("Failed to withdraw application.");
    },
    onSuccess: () => {
      toast.success("Application withdrawn successfully.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["applications", "mine"] });
    },
  });
};

export const useJobApplications = (
  jobId: string,
  params: {
    status?: string;
    minScore?: number;
    page?: number;
    limit?: number;
  } = {}
) => {
  return useQuery({
    queryKey: ["jobs", jobId, "applications", params],
    queryFn: async () => {
      const res = await applicationsApi.getJobApplications(jobId, params);
      return res.data;
    },
    enabled: Boolean(jobId),
    placeholderData: (previousData) => previousData,
  });
};

export const useUpdateApplicationStatus = (jobId?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      status,
      recruiterNote,
    }: {
      id: string;
      status: "shortlisted" | "rejected" | "hired";
      recruiterNote?: string;
    }) => applicationsApi.updateApplicationStatus(id, status, recruiterNote),
    onMutate: async ({ id, status, recruiterNote }) => {
      const queryKey = ["jobs", jobId, "applications"];
      await queryClient.cancelQueries({ queryKey });

      const previousData = queryClient.getQueriesData<ApplicationsResponseData>({ queryKey });

      queryClient.setQueriesData<ApplicationsResponseData>({ queryKey }, (old) => {
        if (!old) return old;
        return {
          ...old,
          applications: old.applications.map((app) =>
            app._id === id
              ? {
                  ...app,
                  status,
                  recruiterNote: recruiterNote || app.recruiterNote,
                  statusHistory: [
                    ...app.statusHistory,
                    { status, at: new Date().toISOString() },
                  ],
                }
              : app
          ),
        };
      });

      return { previousData };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast.error("Failed to update applicant status.");
    },
    onSuccess: (_, vars) => {
      toast.success(`Candidate status updated to ${vars.status}. Email notification sent.`);
    },
    onSettled: () => {
      if (jobId) {
        queryClient.invalidateQueries({ queryKey: ["jobs", jobId, "applications"] });
      }
    },
  });
};

