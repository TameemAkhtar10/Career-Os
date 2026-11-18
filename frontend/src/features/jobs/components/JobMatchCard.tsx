"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "../../../providers/AuthProvider";
import { useJobMatch } from "../hooks/useJobMatch";
import { Card } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { ROUTES } from "../../../constants/routes";
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  FileCheck2,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";

export interface JobMatchCardProps {
  jobId: string;
}

export const JobMatchCard: React.FC<JobMatchCardProps> = ({ jobId }) => {
  const { user, isAuthenticated } = useAuth();

  // Strictly hidden for logged-out users and recruiters
  if (!isAuthenticated || user?.role !== "candidate") {
    return null;
  }

  const { data: matchData, isLoading, isError, refetch } = useJobMatch(jobId);

  if (isLoading) {
    return (
      <Card className="p-6 bg-cream border-champagne-border space-y-4 animate-pulse">
        <div className="h-5 w-48 bg-champagne/80 rounded" />
        <div className="h-4 w-72 bg-champagne/60 rounded" />
        <div className="flex items-center gap-6 pt-3">
          <div className="w-20 h-20 rounded-full bg-champagne/80" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-full bg-champagne/60 rounded" />
            <div className="h-4 w-3/4 bg-champagne/60 rounded" />
          </div>
        </div>
      </Card>
    );
  }

  if (isError || !matchData) {
    return (
      <Card className="p-5 bg-cream border-champagne-border space-y-3">
        <div className="flex items-center gap-2 text-gold">
          <AlertCircle className="w-4 h-4" />
          <span className="text-xs font-semibold">Unable to calculate match score</span>
        </div>
        <p className="text-xs text-muted">
          We encountered an issue checking your profile against this role.
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="text-xs text-emerald font-semibold underline hover:text-emerald-dark"
        >
          Try again
        </button>
      </Card>
    );
  }

  const {
    matchScore,
    matchedSkills = [],
    missingSkills = [],
    hasResume,
    hasProfileSkills,
    tips = [],
  } = matchData;

  // Empty state: candidate has neither profile skills nor resume
  if (!hasProfileSkills && !hasResume) {
    return (
      <Card className="p-6 bg-cream border-border shadow-emerald-sm space-y-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-ui bg-champagne/80 text-emerald shrink-0">
            <Sparkles className="w-5 h-5 text-gold" />
          </div>
          <div className="space-y-1">
            <h3 className="font-display text-lg font-bold text-emerald-dark">
              How well do you match?
            </h3>
            <p className="text-xs text-muted leading-relaxed">
              Add technical skills to your candidate profile and upload a resume to view your personalized match breakdown and skill gap insights.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 pt-2">
          <Link href={ROUTES.CANDIDATE.PROFILE}>
            <Button size="sm" variant="primary">
              Update my skills
            </Button>
          </Link>
          <Link href={ROUTES.CANDIDATE.RESUME_CHECK}>
            <Button size="sm" variant="outline">
              Check resume
            </Button>
          </Link>
        </div>

        <p className="text-[11px] text-muted/80 italic pt-2 border-t border-border/50">
          This is an estimate based on your profile and resume, not an employer decision.
        </p>
      </Card>
    );
  }

  // SVG ring calculation
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    matchScore != null
      ? circumference - (matchScore / 100) * circumference
      : circumference;

  const scoreColor =
    matchScore != null && matchScore >= 70
      ? "text-emerald stroke-emerald"
      : matchScore != null && matchScore >= 40
      ? "text-gold stroke-gold"
      : "text-muted stroke-muted";

  return (
    <Card className="p-6 bg-cream border-border shadow-emerald-sm space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 border-b border-border/60 pb-4">
        <div>
          <div className="flex items-center gap-1.5 text-emerald mb-1">
            <Sparkles className="w-4 h-4 text-gold shrink-0" />
            <h3 className="font-display text-lg font-bold text-emerald-dark leading-tight">
              How well do you match?
            </h3>
          </div>
          <p className="text-xs text-muted">
            Skills and readiness comparison against this opening
          </p>
        </div>

        {/* Circular Gauge */}
        {matchScore != null && (
          <div className="relative flex items-center justify-center shrink-0 w-20 h-20">
            <svg className="w-20 h-20 transform -rotate-90">
              <circle
                cx="40"
                cy="40"
                r={radius}
                className="stroke-champagne-border/60"
                strokeWidth="6"
                fill="transparent"
              />
              <circle
                cx="40"
                cy="40"
                r={radius}
                className={`${scoreColor} transition-all duration-700 ease-out`}
                strokeWidth="6"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="font-display text-lg font-bold text-emerald-dark leading-none">
                {matchScore}%
              </span>
              <span className="text-[9px] uppercase font-bold text-muted mt-0.5">
                Match
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Skills breakdown */}
      <div className="space-y-3">
        {/* Matched skills */}
        {matchedSkills.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-dark mb-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald" />
              <span>Skills you have ({matchedSkills.length})</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {matchedSkills.map((skill, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-emerald/10 text-emerald-dark border border-emerald/25 font-medium"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald" />
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Missing skills */}
        {missingSkills.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gold-dark mb-2">
              <AlertCircle className="w-3.5 h-3.5 text-gold" />
              <span>Skills to add or learn ({missingSkills.length})</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {missingSkills.map((skill, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-gold/15 text-gold-dark border border-gold/30 font-medium"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-gold" />
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Recommendations & Tips */}
      {tips.length > 0 && (
        <div className="p-3.5 rounded-ui bg-champagne/40 border border-border/80 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-dark">
            <Lightbulb className="w-3.5 h-3.5 text-gold" />
            <span>Honest recommendations</span>
          </div>
          <ul className="space-y-1.5">
            {tips.map((tip, idx) => (
              <li key={idx} className="text-xs text-body/80 flex items-start gap-2">
                <span className="text-gold font-bold">•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Action CTA Buttons */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
        <Link
          href={`/candidate/resume-check?jobId=${jobId}`}
          className="flex-1"
        >
          <Button size="sm" variant="primary" className="w-full gap-1.5">
            <FileCheck2 className="w-3.5 h-3.5" />
            <span>Check my resume for this job</span>
          </Button>
        </Link>

        <Link href={ROUTES.CANDIDATE.PROFILE} className="sm:w-auto">
          <Button size="sm" variant="outline" className="w-full">
            Update my skills
          </Button>
        </Link>
      </div>

      {/* Honest disclaimer */}
      <p className="text-[11px] text-muted text-center pt-2 border-t border-border/50">
        This is an estimate based on your profile and resume, not an employer decision.
      </p>
    </Card>
  );
};
