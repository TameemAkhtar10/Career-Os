import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { accountApi, NotificationPreferences } from "../services/account.api";

const PREFS_QUERY_KEY = ["account", "notification-preferences"];

export function useNotificationPreferences() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: PREFS_QUERY_KEY,
    queryFn: async () => {
      const res = await accountApi.getNotificationPreferences();
      return res.data;
    },
    staleTime: 60 * 1000,
  });

  const mutation = useMutation({
    mutationFn: async (updated: Partial<NotificationPreferences>) => {
      const res = await accountApi.updateNotificationPreferences(updated);
      return res.data;
    },
    onMutate: async (newPref) => {
      // Cancel outgoing queries to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: PREFS_QUERY_KEY });
      const previous = queryClient.getQueryData<NotificationPreferences>(PREFS_QUERY_KEY);

      if (previous) {
        queryClient.setQueryData<NotificationPreferences>(PREFS_QUERY_KEY, {
          ...previous,
          ...newPref,
        });
      }

      return { previous };
    },
    onError: (err: Error, _variables, context) => {
      // Rollback on failure
      if (context?.previous) {
        queryClient.setQueryData(PREFS_QUERY_KEY, context.previous);
      }
      toast.error(err?.message || "Failed to update notification settings. Reverted.");
    },
    onSuccess: (data) => {
      queryClient.setQueryData(PREFS_QUERY_KEY, data);
      toast.success("Notification preferences updated.");
    },
  });

  return {
    preferences: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    updatePreference: (key: keyof NotificationPreferences, value: boolean) =>
      mutation.mutate({ [key]: value }),
    isUpdating: mutation.isPending,
  };
}

