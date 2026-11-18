"use client";

import React from "react";
import { useAuth } from "../../../providers/AuthProvider";
import { useJobMatch } from "../hooks/useJobMatch";
import { Sparkles } from "lucide-react";

export interface JobMatchBadgeProps {
  jobId: string;
}

export const JobMatchBadge: React.FC<JobMatchBadgeProps> = ({ jobId }) => {
  const { user, isAuthenticated } = useAuth();
  const isCandidate = isAuthenticated && user?.role === "candidate";

  const { data: matchData, isLoading } = useJobMatch(jobId, isCandidate);

  if (!isCandidate || isLoading || !matchData || matchData.matchScore == null) {
    return null;
  }

  const score = matchData.matchScore;
  const isHigh = score >= 70;
  const isMedium = score >= 40 && score < 70;

  const colorClass = isHigh
    ? "bg-emerald/10 text-emerald-dark border-emerald/30"
    : isMedium
    ? "bg-gold/15 text-gold-dark border-gold/40"
    : "bg-muted/10 text-muted border-muted/30";

  return (
    <span
      title={`Calculated match score based on your profile skills & resume`}
      className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${colorClass}`}
    >
      <Sparkles className="w-2.5 h-2.5 shrink-0" />
      <span>{score}% Match</span>
    </span>
  );
};
