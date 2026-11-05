"use client";

import React, { useEffect } from "react";
import { Button } from "../components/ui/Button";
import { AlertTriangle, RotateCcw } from "lucide-react";
import Link from "next/link";
import { ROUTES } from "../constants/routes";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-lg mx-auto">
      <div className="w-16 h-16 rounded-full bg-error-bg border border-error-border flex items-center justify-center text-error mb-4 shadow-emerald-sm">
        <AlertTriangle className="w-8 h-8" />
      </div>
      <h1 className="font-display text-3xl font-bold tracking-[-0.01em] text-emerald-dark mb-2">
        Something went wrong
      </h1>
      <p className="text-sm text-muted mb-8 leading-relaxed">
        An unexpected error occurred while processing this request. You can attempt to reload the view or return to the main dashboard.
      </p>
      <div className="flex items-center gap-3">
        <Button onClick={() => reset()} variant="primary" className="gap-2">
          <RotateCcw className="w-4 h-4" />
          Try Again
        </Button>
        <Link href={ROUTES.HOME}>
          <Button variant="secondary">Go Home</Button>
        </Link>
      </div>
    </div>
  );
}

