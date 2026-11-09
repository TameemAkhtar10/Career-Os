import { apiClient } from "../../../config/api";
import { ApiResponse } from "../../../types/api";

export interface NotificationPreferences {
  jobAlerts: boolean;
  applicantDigest: boolean;
  profileNudges: boolean;
}

export const accountApi = {
  exportData: (): Promise<ApiResponse<unknown>> =>
    apiClient<unknown>("/api/account/export", { method: "GET" }),

  deleteAccount: (password: string): Promise<ApiResponse<null>> =>
    apiClient<null>("/api/account", {
      method: "DELETE",
      body: JSON.stringify({ password }),
    }),

  getNotificationPreferences: (): Promise<ApiResponse<NotificationPreferences>> =>
    apiClient<NotificationPreferences>("/api/account/notification-preferences", {
      method: "GET",
    }),

  updateNotificationPreferences: (
    prefs: Partial<NotificationPreferences>
  ): Promise<ApiResponse<NotificationPreferences>> =>
    apiClient<NotificationPreferences>("/api/account/notification-preferences", {
      method: "PATCH",
      body: JSON.stringify(prefs),
    }),
};

