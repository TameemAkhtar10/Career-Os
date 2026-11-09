import { apiClient } from "../../../config/api";
import { ApiResponse } from "../../../types/api";

export interface UnsubscribeResponse {
  unsubscribed: boolean;
  type: string;
}

export const notificationApi = {
  unsubscribe: (token: string): Promise<ApiResponse<UnsubscribeResponse>> =>
    apiClient<UnsubscribeResponse>("/api/notifications/unsubscribe", {
      method: "POST",
      body: JSON.stringify({ token }),
    }),
};

