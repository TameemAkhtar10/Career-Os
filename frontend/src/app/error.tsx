"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { Button } from "../components/ui/Button";
import { Logo } from "../components/layout/Logo";
import { ROUTES } from "../constants/routes";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Career OS Application Error]:", error);
  }, [error]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-lg mx-auto space-y-6">
      {/* Brand Logo */}
      <div className="mb-2">
        <Logo />
      </div>

      <div className="w-16 h-16 rounded-full bg-error-bg border border-error-border flex items-center justify-center text-error mx-auto shadow-emerald-sm">
        <AlertTriangle className="w-8 h-8" />
      </div>

      <div className="space-y-2">
        <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-emerald-dark">
          Something went wrong
        </h1>
        <p className="text-sm text-muted leading-relaxed">
          An unexpected error occurred while processing this view. You can attempt to reload or return home.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <Button onClick={() => reset()} variant="primary" size="md" className="gap-2">
          <RotateCcw className="w-4 h-4" />
          Try Again
        </Button>
        <Link href={ROUTES.HOME}>
          <Button variant="secondary" size="md" className="gap-2">
            <Home className="w-4 h-4" />
            Go Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
