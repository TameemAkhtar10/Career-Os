"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "../../../providers/AuthProvider";
import { useSavedJobIds, useToggleSaveJob } from "../hooks/useSavedJobs";
import { Bookmark, Heart } from "lucide-react";
import { toast } from "sonner";

export interface BookmarkButtonProps {
  jobId: string;
  size?: "sm" | "md" | "lg";
  variant?: "heart" | "bookmark";
  showLabel?: boolean;
  className?: string;
}

export const BookmarkButton: React.FC<BookmarkButtonProps> = ({
  jobId,
  size = "md",
  variant = "heart",
  showLabel = false,
  className = "",
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuth();
  const { data: savedIds = [] } = useSavedJobIds();
  const toggleSave = useToggleSaveJob();

  const isSaved = savedIds.includes(jobId);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      const returnUrl = pathname ? `${pathname}` : "/jobs";
      router.push(`/login?next=${encodeURIComponent(returnUrl)}`);
      return;
    }

    if (user?.role !== "candidate") {
      toast.info("Only candidates can bookmark saved jobs.");
      return;
    }

    toggleSave.mutate({ jobId, isSaved });
  };

  const iconSizes = {
    sm: "w-3.5 h-3.5",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  const Icon = variant === "bookmark" ? Bookmark : Heart;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={toggleSave.isPending}
      aria-label={isSaved ? "Remove from saved jobs" : "Save this job"}
      title={isSaved ? "Remove from saved jobs" : "Save this job"}
      className={`inline-flex items-center justify-center gap-1.5 transition-all rounded-ui focus:outline-none focus:ring-2 focus:ring-gold/30 disabled:opacity-60 ${
        isSaved
          ? "text-gold hover:text-gold-dark"
          : "text-muted hover:text-emerald-dark hover:bg-champagne/40"
      } ${className}`}
    >
      <Icon
        className={`${iconSizes[size]} transition-transform active:scale-90 ${
          isSaved ? "fill-gold text-gold" : "text-muted hover:text-emerald-dark"
        }`}
      />
      {showLabel && (
        <span className="text-xs font-semibold">
          {isSaved ? "Saved" : "Save job"}
        </span>
      )}
    </button>
  );
};
