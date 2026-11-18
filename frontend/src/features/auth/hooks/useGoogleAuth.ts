"use client";

import { useMutation } from "@tanstack/react-query";
import { authApi, GoogleAuthResponse } from "../services/auth.api";
import { ApiResponse } from "../../../types/api";

export const useGoogleSignIn = () => {
  return useMutation<
    ApiResponse<GoogleAuthResponse>,
    Error,
    { credential: string; role?: "candidate" | "recruiter" }
  >({
    mutationFn: (data) => authApi.googleSignIn(data),
  });
};
