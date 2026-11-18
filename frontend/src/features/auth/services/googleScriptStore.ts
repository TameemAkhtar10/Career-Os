import { useSyncExternalStore } from "react";

export type GoogleScriptStatus = "idle" | "loading" | "ready" | "failed";

let currentStatus: GoogleScriptStatus = "idle";
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch {
      // ignore subscriber errors
    }
  });
}

export const googleScriptStore = {
  getStatus: (): GoogleScriptStatus => {
    // If the GIS script is already present on window, it is ready immediately
    if (typeof window !== "undefined" && Boolean(window.google?.accounts?.id)) {
      return "ready";
    }
    return currentStatus;
  },

  setStatus: (newStatus: GoogleScriptStatus) => {
    if (currentStatus !== newStatus) {
      currentStatus = newStatus;
      notify();
    }
  },

  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};

/**
 * Hook to consume the shared Google Identity Services script state.
 */
export function useGoogleScriptReady() {
  const status = useSyncExternalStore(
    googleScriptStore.subscribe,
    googleScriptStore.getStatus,
    () => "idle" // SSR snapshot
  );

  return {
    isReady: status === "ready",
    isFailed: status === "failed",
    status,
  };
}
