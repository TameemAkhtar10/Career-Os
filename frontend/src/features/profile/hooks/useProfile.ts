"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { profileApi } from "../services/profile.api";
import { CandidateProfile, RecruiterProfile } from "../../../types/profile";
import { toast } from "sonner";

export const useProfileMe = () => {
  return useQuery({
    queryKey: ["profile", "me"],
    queryFn: async () => {
      const res = await profileApi.getProfileMe();
      return res.data;
    },
  });
};

export const useCandidateProfile = (userId: string) => {
  return useQuery({
    queryKey: ["profile", "candidate", userId],
    queryFn: async () => {
      const res = await profileApi.getCandidateProfileById(userId);
      return res.data;
    },
    enabled: Boolean(userId),
  });
};

export const useUpdateCandidateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<CandidateProfile>) => profileApi.updateCandidateProfile(data),
    onSuccess: (res) => {
      queryClient.setQueryData(["profile", "me"], res.data);
      toast.success(res.message || "Profile updated successfully.");
    },
  });
};

export const useUpdateRecruiterProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<RecruiterProfile>) => profileApi.updateRecruiterProfile(data),
    onSuccess: (res) => {
      queryClient.setQueryData(["profile", "me"], res.data);
      toast.success(res.message || "Company profile updated successfully.");
    },
  });
};

export const useUploadResume = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      file,
      onProgress,
    }: {
      file: File;
      onProgress?: (pct: number) => void;
    }) => profileApi.uploadResume(file, onProgress),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", "me"] });
    },
  });
};

export const useDeleteResume = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => profileApi.deleteResume(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", "me"] });
      toast.success("Resume deleted.");
    },
  });
};

export const useUploadLogo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => profileApi.uploadLogo(file),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["profile", "me"] });
      toast.success("Company logo updated.");
    },
  });
};

