"use client";

import React, { useEffect } from "react";
import Script from "next/script";
import { googleScriptStore } from "../services/googleScriptStore";

/**
 * Loads the Google Identity Services (GIS) client script once at app level.
 * Updates the shared googleScriptStore on load, ready, or error.
 */
export const GoogleScript: React.FC = () => {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  useEffect(() => {
    // Check if the script is already present on window (e.g. from client navigation or cache)
    if (typeof window !== "undefined" && Boolean(window.google?.accounts?.id)) {
      googleScriptStore.setStatus("ready");
    }
  }, []);

  if (!clientId) {
    return null;
  }

  return (
    <Script
      id="google-identity-services"
      src="https://accounts.google.com/gsi/client"
      strategy="afterInteractive"
      onLoad={() => {
        googleScriptStore.setStatus("ready");
      }}
      onReady={() => {
        googleScriptStore.setStatus("ready");
      }}
      onError={() => {
        if (process.env.NODE_ENV !== "production") {
          console.warn("[GoogleScript] Google Identity Services script failed to load (blocked or network error).");
        }
        googleScriptStore.setStatus("failed");
      }}
    />
  );
};
