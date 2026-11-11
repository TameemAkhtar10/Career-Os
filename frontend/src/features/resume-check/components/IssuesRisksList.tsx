import React, { useState } from "react";
import { Issue } from "../types";
import { Card } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { AlertCircle, AlertTriangle, Info, ChevronDown, ChevronUp, Wrench, CheckCircle2 } from "lucide-react";

interface IssuesRisksListProps {
  issues: Issue[];
}

export const IssuesRisksList: React.FC<IssuesRisksListProps> = ({ issues }) => {
  const [expandedIndices, setExpandedIndices] = useState<number[]>([0]);

  if (!issues || issues.length === 0) {
    return (
      <Card className="p-6 bg-cream border-border text-center space-y-2">
        <p className="text-sm font-semibold text-emerald">No high-priority risks found</p>
        <p className="text-xs text-muted">
          Your resume meets all baseline formatting, contact, and structural checks.
        </p>
      </Card>
    );
  }

  const hasHighPriority = issues.some((i) => i.severity === "high");

  const toggleExpand = (idx: number) => {
    setExpandedIndices((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  return (
    <Card className="p-5 sm:p-6 bg-cream border-border shadow-emerald-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-gold shrink-0" />
          <h3 className="font-display text-base sm:text-lg font-bold text-emerald-dark">
            Identified Risks &amp; Fixes ({issues.length})
          </h3>
        </div>
        <span className="text-xs text-muted">Sorted by severity</span>
      </div>

      {!hasHighPriority && (
        <div className="p-3.5 rounded-ui bg-success-bg/40 border border-success-border/60 flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
          <span className="text-xs font-semibold text-emerald-dark">
            No high-priority risks found
          </span>
        </div>
      )}

      <div className="space-y-3">
        {issues.map((issue, idx) => {
          const isExpanded = expandedIndices.includes(idx);

          let badgeColor = "bg-error-bg text-error border-error-border";
          let icon = <AlertCircle className="w-4 h-4 text-error shrink-0" />;

          if (issue.severity === "medium") {
            badgeColor = "bg-champagne/60 text-gold-hover border-gold/40";
            icon = <AlertTriangle className="w-4 h-4 text-gold shrink-0" />;
          } else if (issue.severity === "low") {
            badgeColor = "bg-cream-input text-muted border-border";
            icon = <Info className="w-4 h-4 text-muted shrink-0" />;
          }

          // Sanitize legacy stored titles/details to remove ATS wording
          const displayTitle = issue.title.replace(/\bATS\b/g, "Parsing");
          const displayDetail = issue.detail.replace(/\bATS\b/g, "automated screening");
          const displayFix = issue.fix?.replace(/\bATS\b/g, "automated screening");

          return (
            <div
              key={idx}
              className="p-4 rounded-ui border border-border/80 bg-cream-input space-y-2.5 transition-all hover:border-gold/50"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  {icon}
                  <span className="text-sm font-bold text-emerald-dark truncate">
                    {displayTitle}
                  </span>
                  <span
                    className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${badgeColor}`}
                  >
                    {issue.severity} priority
                  </span>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleExpand(idx)}
                  className="text-xs gap-1 self-start sm:self-auto shrink-0"
                >
                  <Wrench className="w-3 h-3 text-gold" />
                  <span>{isExpanded ? "Hide Fix" : "View Fix"}</span>
                  {isExpanded ? (
                    <ChevronUp className="w-3 h-3 ml-0.5" />
                  ) : (
                    <ChevronDown className="w-3 h-3 ml-0.5" />
                  )}
                </Button>
              </div>

              <p className="text-xs text-body/80 leading-relaxed pl-6">
                {displayDetail}
              </p>

              {isExpanded && (
                <div className="ml-6 mt-2 p-3 rounded-ui bg-champagne/40 border border-gold/30 text-xs text-emerald-dark space-y-1 animate-fadeIn">
                  <div className="font-bold flex items-center gap-1.5 text-gold-hover">
                    <Wrench className="w-3.5 h-3.5 text-gold" />
                    <span>Recommended Resolution:</span>
                  </div>
                  <p className="text-body/90 leading-relaxed pl-5">{displayFix}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
};
