"use client";

import React from "react";
import { WifiOff, RotateCcw } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { Logo } from "../../../components/layout/Logo";

export const OfflinePage: React.FC = () => {
  const handleReload = () => {
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-lg mx-auto space-y-6">
      <div className="mb-2">
        <Logo />
      </div>

      <div className="w-16 h-16 rounded-full bg-champagne border border-border flex items-center justify-center text-gold mx-auto shadow-emerald-sm">
        <WifiOff className="w-8 h-8" />
      </div>

      <div className="space-y-2">
        <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-emerald-dark">
          No Internet Connection
        </h1>
        <p className="text-sm text-muted leading-relaxed">
          It appears your network connection is currently offline. Please verify your internet connection and try reloading the page.
        </p>
      </div>

      <div className="pt-2">
        <Button onClick={handleReload} variant="primary" size="md" className="gap-2">
          <RotateCcw className="w-4 h-4" />
          Retry Connection
        </Button>
      </div>
    </div>
  );
};

