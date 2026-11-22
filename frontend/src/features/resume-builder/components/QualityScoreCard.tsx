"use client";

import React from "react";
import { QualityCheckResult } from "../types/resumeBuilder.types";
import { AlertTriangle, Info, HelpCircle } from "lucide-react";

interface QualityScoreCardProps {
  quality: QualityCheckResult | null;
  isLoading: boolean;
  onRefresh: () => void;
}

/**
 * Defensive quality score card.
 * - Never reads quality.metrics, quality.topIssues, quality.score without a fallback.
 * - Handles both historical field names and new backend shape gracefully.
 * - On any unexpected data shape it shows the empty "Run quality check" state.
 */
export const QualityScoreCard: React.FC<QualityScoreCardProps> = ({
  quality,
  isLoading,
  onRefresh,
}) => {
  // ── Empty state ───────────────────────────────────────────────────────────
  if (!quality && !isLoading) {
    return (
      <div className="p-4 rounded-xl bg-champagne/20 border border-champagne-border text-center">
        <p className="text-xs text-body-text/70 mb-2">
          Check how automated screening tools and recruiters will read your resume.
        </p>
        <button
          onClick={onRefresh}
          className="text-xs font-semibold text-emerald-ink hover:underline"
        >
          Run quality check
        </button>
      </div>
    );
  }

  // ── Loading state ─────────────────────────────────────────────────────────
  if (isLoading && !quality) {
    return (
      <div className="p-4 rounded-xl bg-champagne/20 border border-champagne-border text-center">
        <p className="text-xs text-body-text/70 animate-pulse">
          Analyzing resume structure &amp; readability...
        </p>
      </div>
    );
  }

  if (!quality) return null;

  // ── Defensive data extraction ─────────────────────────────────────────────
  // Cast to any so we can safely probe both old and new field names.
  const raw = quality as any;

  // Backend returns `score`; old type used `overallScore` — support both.
  const score: number =
    typeof raw.score === "number"
      ? raw.score
      : typeof raw.overallScore === "number"
      ? raw.overallScore
      : 0;

  // If we still have no meaningful data, fall back to empty state.
  if (score === 0 && !quality.grade && !raw.topIssues && !raw.issues) {
    return (
      <div className="p-4 rounded-xl bg-champagne/20 border border-champagne-border text-center">
        <p className="text-xs text-body-text/70 mb-2">
          Check how automated screening tools and recruiters will read your resume.
        </p>
        <button
          onClick={onRefresh}
          className="text-xs font-semibold text-emerald-ink hover:underline"
        >
          Run quality check
        </button>
      </div>
    );
  }

  const gradeColor =
    score >= 80
      ? "text-emerald-700 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
      : score >= 60
      ? "text-amber-700 dark:text-amber-400 border-amber-500/30 bg-amber-500/10"
      : "text-rose-700 dark:text-rose-400 border-rose-500/30 bg-rose-500/10";

  // Backend sends pageCount at top level; metrics may be absent entirely.
  const metricsObj: Record<string, number> = raw.metrics ?? {};
  const wordCount: number = metricsObj.wordCount ?? 0;
  const sectionsFound: number = metricsObj.sectionsFound ?? 0;
  const pageCount: number = metricsObj.pageCount ?? raw.pageCount ?? 1;

  // Backend field is `topIssues`; old type used `issues` — support both.
  const issues: QualityCheckResult["topIssues"] = Array.isArray(raw.topIssues)
    ? raw.topIssues
    : Array.isArray(raw.issues)
    ? raw.issues
    : [];

  const summary: string | undefined = raw.summary;

  return (
    <div className="p-4 rounded-xl bg-champagne/20 border border-champagne-border space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-ink flex items-center gap-1.5">
            How this will be read
          </h3>
          <p className="text-[11px] text-body-text/70">
            Automated structure, readability &amp; automated screening check
          </p>
        </div>
        <div
          className={`px-2.5 py-1 rounded-lg border font-bold text-xs flex items-center gap-1.5 ${gradeColor}`}
        >
          <span>Score: {score}/100</span>
          {quality.grade && <span>(Grade {quality.grade})</span>}
        </div>
      </div>

      {summary && <p className="text-xs text-body-text/80">{summary}</p>}

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-2 text-center text-[11px] py-2 border-y border-champagne-border/60">
        <div>
          <span className="text-body-text/60 block">Words</span>
          <span className="font-semibold text-emerald-ink">{wordCount}</span>
        </div>
        <div>
          <span className="text-body-text/60 block">Sections</span>
          <span className="font-semibold text-emerald-ink">{sectionsFound} / 6</span>
        </div>
        <div>
          <span className="text-body-text/60 block">Pages</span>
          <span className="font-semibold text-emerald-ink">~{pageCount}</span>
        </div>
      </div>

      {/* Top Issues */}
      {issues.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-semibold text-emerald-ink">Key Improvements:</p>
          <div className="space-y-1.5">
            {issues.slice(0, 4).map((issue, idx) => (
              <div
                key={idx}
                className="text-[11px] p-2 rounded-lg bg-cream/70 border border-champagne-border flex items-start gap-2"
              >
                {issue.severity === "error" ? (
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                ) : issue.severity === "warning" ? (
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                ) : (
                  <Info className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <span className="font-medium capitalize text-emerald-ink">
                    [{issue.section || issue.type}]:{" "}
                  </span>
                  <span className="text-body-text/80">{issue.message}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Advisory note */}
      <div className="p-2 rounded-lg bg-champagne/40 text-[10px] text-body-text/70 flex items-start gap-1.5">
        <HelpCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-gold-accent" />
        <span>
          Quality score is an automated estimate verifying section headers, bullet
          formatting, contact completeness, and action verbs. It does not replace
          personal review.
        </span>
      </div>
    </div>
  );
};
