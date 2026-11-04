import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      gcTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      retry: (failureCount, error: any) => {
        // Do not retry 401, 403, 404, or 422 errors
        if (error?.statusCode === 401 || error?.statusCode === 403 || error?.statusCode === 404 || error?.statusCode === 422) {
          return false;
        }
        return failureCount < 2;
      },
    },
  },
});

