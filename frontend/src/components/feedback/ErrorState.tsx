"use client";

import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "../ui/Button";

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = "Unable to load data",
  message = "A server error occurred. Please check your connection and try again.",
  onRetry,
  className = "",
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 sm:p-12 border border-error-border rounded-card bg-error-bg/40 ${className}`}
    >
      <div className="w-14 h-14 rounded-full bg-error-bg flex items-center justify-center text-error mb-4 shadow-emerald-sm border border-error-border">
        <AlertCircle className="w-7 h-7" />
      </div>
      <h3 className="font-display text-xl font-semibold text-error mb-1">
        {title}
      </h3>
      <p className="text-sm text-body/80 max-w-md mb-6 leading-relaxed">
        {message}
      </p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" size="sm" className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Try Again
        </Button>
      )}
    </div>
  );
};

