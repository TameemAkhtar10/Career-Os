"use client";

import React from "react";
import { FolderSearch } from "lucide-react";
import { Button } from "../ui/Button";

export interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  actionLabel,
  onAction,
  className = "",
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 sm:p-12 border border-dashed border-border rounded-card bg-cream/50 ${className}`}
    >
      <div className="w-14 h-14 rounded-full bg-champagne flex items-center justify-center text-gold mb-4 shadow-emerald-sm">
        {icon || <FolderSearch className="w-7 h-7" />}
      </div>
      <h3 className="font-display text-xl font-semibold text-emerald-dark mb-1">
        {title}
      </h3>
      <p className="text-sm text-muted max-w-md mb-6 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button onClick={onAction} variant="secondary" size="sm">
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

