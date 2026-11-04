"use client";

import React, { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

export const OfflineBanner: React.FC = () => {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    if (typeof window !== "undefined") {
      setIsOffline(!window.navigator.onLine);
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div
      role="status"
      className="bg-error text-white px-4 py-2 text-xs font-semibold flex items-center justify-center gap-2 sticky top-0 z-50 shadow-md animate-fadeIn"
    >
      <WifiOff className="w-4 h-4 shrink-0" />
      <span>You are currently offline. Check your internet connection.</span>
    </div>
  );
};

