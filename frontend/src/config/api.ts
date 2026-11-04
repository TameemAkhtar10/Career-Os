import { toast } from "sonner";
import { ApiErrorResponse, ApiResponse, FieldError } from "../types/api";

export class ApiClientError extends Error {
  statusCode: number;
  errors?: FieldError[];

  constructor(message: string, statusCode: number, errors?: FieldError[]) {
    super(message);
    this.name = "ApiClientError";
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve();
    }
  });
  failedQueue = [];
};

interface RequestOptions extends RequestInit {
  skipAuthRefresh?: boolean;
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  const isServer = typeof window === "undefined";
  const baseUrl = isServer
    ? process.env.BACKEND_URL || "http://localhost:3000"
    : "";

  const url = `${baseUrl}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const config: RequestInit = {
    ...options,
    headers,
    credentials: "include", // send cookies
  };

  try {
    const res = await fetch(url, config);

    if (res.status === 401 && !options.skipAuthRefresh && !endpoint.includes("/auth/")) {
      if (isServer) {
        throw new ApiClientError("Authentication required", 401);
      }

      if (isRefreshing) {
        return new Promise<ApiResponse<T>>((resolve, reject) => {
          failedQueue.push({
            resolve: () => apiClient<T>(endpoint, options).then(resolve).catch(reject),
            reject: (err) => reject(err),
          });
        });
      }

      isRefreshing = true;

      try {
        const refreshRes = await fetch("/api/auth/refresh", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });

        if (!refreshRes.ok) {
          throw new Error("Refresh failed");
        }

        processQueue(null);
        return apiClient<T>(endpoint, options);
      } catch (refreshErr) {
        processQueue(refreshErr);
        if (typeof window !== "undefined") {
          toast.error("Session expired. Please log in again.");
          window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
        }
        throw new ApiClientError("Session expired", 401);
      } finally {
        isRefreshing = false;
      }
    }

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const errorData = data as ApiErrorResponse | null;
      let message = errorData?.message;

      if (!message) {
        if (res.status === 403) message = "You do not have permission to perform this action.";
        else if (res.status === 404) message = "Resource not found.";
        else if (res.status === 429) message = "Too many requests. Please wait and try again.";
        else if (res.status >= 500) message = "Something went wrong on the server.";
        else message = `Request failed with status ${res.status}`;
      }

      throw new ApiClientError(message, res.status, errorData?.errors);
    }

    return data as ApiResponse<T>;
  } catch (err: unknown) {
    if (err instanceof ApiClientError) {
      throw err;
    }

    // Network / offline error
    const message = "Server not reachable. Please check your connection.";
    throw new ApiClientError(message, 0);
  }
}

/**
 * Maps API validation errors to react-hook-form setError calls.
 */
export function mapApiErrorsToForm<TFieldValues extends Record<string, unknown>>(
  errors: FieldError[] | undefined,
  setError: (
    name: any,
    error: { type: string; message: string }
  ) => void
) {
  if (!errors || !Array.isArray(errors)) return;
  errors.forEach((err) => {
    setError(err.field as any, {
      type: "server",
      message: err.message,
    });
  });
}

