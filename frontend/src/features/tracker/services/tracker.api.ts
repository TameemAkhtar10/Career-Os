import { apiClient } from "@/config/api";
import {
  TrackerEntry,
  TrackerResponse,
  TrackerSummaryResponse,
  CreateTrackerEntryInput,
  UpdateTrackerEntryInput,
} from "../types/tracker.types";

export const trackerApi = {
  getEntries: async (params?: {
    stage?: string;
    search?: string;
    upcoming?: boolean;
    page?: number;
    limit?: number;
  }): Promise<TrackerResponse> => {
    const query = new URLSearchParams();
    if (params?.stage) query.set("stage", params.stage);
    if (params?.search) query.set("search", params.search);
    if (params?.upcoming) query.set("upcoming", "true");
    if (params?.page) query.set("page", String(params.page));
    if (params?.limit) query.set("limit", String(params.limit));

    const qs = query.toString();
    const endpoint = `/api/tracker${qs ? `?${qs}` : ""}`;
    const res = await apiClient<TrackerResponse>(endpoint, { method: "GET" });
    return res.data;
  },

  getSummary: async (): Promise<TrackerSummaryResponse> => {
    const res = await apiClient<TrackerSummaryResponse>("/api/tracker/summary", { method: "GET" });
    return res.data;
  },

  createEntry: async (input: CreateTrackerEntryInput): Promise<TrackerEntry> => {
    const res = await apiClient<TrackerEntry>("/api/tracker", {
      method: "POST",
      body: JSON.stringify(input),
    });
    return res.data;
  },

  updateEntry: async (id: string, input: UpdateTrackerEntryInput): Promise<TrackerEntry> => {
    const res = await apiClient<TrackerEntry>(`/api/tracker/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
    return res.data;
  },

  deleteEntry: async (id: string): Promise<{ deleted?: boolean; hidden?: boolean }> => {
    const res = await apiClient<{ deleted?: boolean; hidden?: boolean }>(`/api/tracker/${id}`, {
      method: "DELETE",
    });
    return res.data;
  },
};
