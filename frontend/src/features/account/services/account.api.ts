import { apiClient } from "../../../config/api";
import { ApiResponse } from "../../../types/api";

export const accountApi = {
  exportData: (): Promise<ApiResponse<unknown>> =>
    apiClient<unknown>("/api/account/export", { method: "GET" }),

  deleteAccount: (password: string): Promise<ApiResponse<null>> =>
    apiClient<null>("/api/account", {
      method: "DELETE",
      body: JSON.stringify({ password }),
    }),
};

