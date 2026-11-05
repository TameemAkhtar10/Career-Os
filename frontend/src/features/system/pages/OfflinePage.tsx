"use client";

import React from "react";
import { WifiOff, RotateCcw } from "lucide-react";
import { Button } from "../../../components/ui/Button";

export const OfflinePage: React.FC = () => {
  const handleReload = () => {
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-lg mx-auto">
      <div className="w-16 h-16 rounded-full bg-champagne border border-border flex items-center justify-center text-gold mb-4 shadow-emerald-sm">
        <WifiOff className="w-8 h-8" />
      </div>
      <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-[-0.01em] text-emerald-dark mb-2">
        No Internet Connection
      </h1>
      <p className="text-sm text-muted mb-8 leading-relaxed">
        It appears your network connection is currently offline. Please verify your internet connection and try reloading the page.
      </p>
      <Button onClick={handleReload} variant="primary" className="gap-2">
        <RotateCcw className="w-4 h-4" />
        Retry Connection
      </Button>
    </div>
  );
};

