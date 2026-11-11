import React from "react";
import { Keywords } from "../types";
import { Card } from "../../../components/ui/Card";
import { Check, X, Tag } from "lucide-react";

interface KeywordsAnalysisProps {
  keywords: Keywords;
  targetRoleTitle?: string;
  hasTarget?: boolean;
  hasProfileSkills?: boolean;
}

export const KeywordsAnalysis: React.FC<KeywordsAnalysisProps> = ({
  keywords,
  targetRoleTitle,
  hasTarget,
  hasProfileSkills = false,
}) => {
  const present = keywords?.present || [];
  const missing = keywords?.missing || [];
  const isTargeted = Boolean(hasTarget || targetRoleTitle);

  const presentHeading = isTargeted
    ? `Strong Keywords (${present.length})`
    : `Skills found in your resume (${present.length})`;

  const missingHeading = isTargeted
    ? `Missing Keywords (${missing.length})`
    : `Skills in your profile but not found in your resume (${missing.length})`;

  return (
    <Card className="p-5 sm:p-6 bg-cream border-border shadow-emerald-sm space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Tag className="w-5 h-5 text-gold shrink-0" />
          <div>
            <h3 className="font-display text-base sm:text-lg font-bold text-emerald-dark">
              Keywords &amp; Skill Coverage
            </h3>
            <p className="text-xs text-muted">
              {isTargeted
                ? `Compared against target role: ${targetRoleTitle || "Target Role"}`
                : "Matched against recognized technical skills"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Present / Found Skills */}
        <div className="p-4 rounded-ui bg-success-bg/30 border border-success-border space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-emerald-dark flex items-center gap-1.5 uppercase tracking-wider">
              <Check className="w-3.5 h-3.5 text-success shrink-0" />
              <span>{presentHeading}</span>
            </span>
            <span className="text-[10px] text-muted shrink-0">Detected in resume</span>
          </div>

          {present.length === 0 ? (
            <p className="text-xs text-muted italic">No matching skills detected.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {present.map((kw, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-white border border-success-border text-emerald-dark shadow-sm"
                >
                  <Check className="w-3 h-3 text-success" />
                  <span>{kw}</span>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Missing / Profile Comparison Skills */}
        <div className="p-4 rounded-ui bg-champagne/30 border border-border space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-gold-hover flex items-center gap-1.5 uppercase tracking-wider">
              <X className="w-3.5 h-3.5 text-gold shrink-0" />
              <span>{missingHeading}</span>
            </span>
            <span className="text-[10px] text-muted shrink-0">
              {isTargeted ? "Recommended to incorporate" : "Profile skill gap"}
            </span>
          </div>

          {!isTargeted && !hasProfileSkills ? (
            <p className="text-xs text-muted italic">
              Add skills to your profile to compare
            </p>
          ) : missing.length === 0 ? (
            <p className="text-xs text-success font-medium">
              {isTargeted
                ? "Excellent! No missing target keywords identified."
                : "All skills in your profile were found in your resume."}
            </p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {missing.map((kw, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-white border border-border text-body/90 shadow-sm"
                >
                  <X className="w-3 h-3 text-gold" />
                  <span>{kw}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
