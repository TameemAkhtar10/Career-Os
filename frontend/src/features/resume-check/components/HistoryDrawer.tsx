import React, { useState } from "react";
import { ResumeAnalysisSummary } from "../types";
import { Button } from "../../../components/ui/Button";
import {
  History,
  TrendingUp,
  Trash2,
  Eye,
  ShieldAlert,
  X,
  Calendar,
} from "lucide-react";

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  analyses: ResumeAnalysisSummary[];
  onSelectAnalysis: (id: string) => void;
  onDeleteAnalysis: (id: string) => void;
  onClearAllAnalyses: () => void;
  onWithdrawConsent: () => void;
  isDeleting?: boolean;
  isClearingAll?: boolean;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Clean SVG Trend Line component built purely from real score data
 */
function RealScoreTrendLine({ items }: { items: ResumeAnalysisSummary[] }) {
  if (items.length < 2) return null;

  // Chronological order for trend line (oldest to newest)
  const sorted = [...items].reverse();
  const width = 360;
  const height = 90;
  const padding = 15;

  const minScore = 0;
  const maxScore = 100;

  const points = sorted.map((item, i) => {
    const x = padding + (i / (sorted.length - 1)) * (width - 2 * padding);
    const y = height - padding - (item.score / maxScore) * (height - 2 * padding);
    return { x, y, score: item.score, date: item.createdAt };
  });

  const pathD = points.reduce(
    (acc, pt, i) => (i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`),
    ""
  );

  return (
    <div className="p-3.5 rounded-ui bg-cream-input border border-border/80 space-y-2">
      <div className="flex items-center justify-between text-[11px] font-semibold text-emerald-dark">
        <span className="flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5 text-gold" />
          Score Progress Trend ({sorted.length} scans)
        </span>
        <span className="text-muted tabular-nums">
          Latest: {sorted[sorted.length - 1].score}/100
        </span>
      </div>

      <div className="w-full overflow-hidden flex justify-center">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full max-w-sm h-20 overflow-visible">
          {/* Baseline grid */}
          <line
            x1={padding}
            y1={height - padding}
            x2={width - padding}
            y2={height - padding}
            stroke="#E8D3AA"
            strokeDasharray="4 4"
            strokeWidth={1}
          />

          {/* Stroke Path */}
          <path d={pathD} fill="none" stroke="#064E3B" strokeWidth={2.5} strokeLinecap="round" />

          {/* Score dots */}
          {points.map((pt, i) => (
            <g key={i}>
              <circle cx={pt.x} cy={pt.y} r={4} fill="#C8963E" stroke="#FFF8EC" strokeWidth={2} />
              <text
                x={pt.x}
                y={pt.y - 7}
                fontSize={9}
                textAnchor="middle"
                fill="#064E3B"
                fontWeight="bold"
              >
                {pt.score}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  analyses,
  onSelectAnalysis,
  onDeleteAnalysis,
  onClearAllAnalyses,
  onWithdrawConsent,
  isDeleting = false,
  isClearingAll = false,
}) => {
  const [showConsentConfirm, setShowConsentConfirm] = useState(false);
  const [showClearAllConfirm, setShowClearAllConfirm] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-emerald-dark/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-cream border-l border-border h-full max-w-md w-full shadow-emerald-float flex flex-col justify-between animate-slideUp">
        {/* Drawer Header */}
        <div className="p-5 border-b border-border/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-gold" />
            <h3 className="font-display text-lg font-bold text-emerald-dark">
              Resume Scan History
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-ui text-muted hover:text-body focus:outline-none"
            aria-label="Close drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Trend Line (when 2+ items exist) */}
          <RealScoreTrendLine items={analyses} />

          {/* Clear all history bar when items exist */}
          {analyses.length > 0 && (
            <div className="flex items-center justify-between pb-1">
              <span className="text-xs text-muted font-medium">
                {analyses.length} {analyses.length === 1 ? "scan recorded" : "scans recorded"}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowClearAllConfirm(true)}
                disabled={isClearingAll || isDeleting}
                className="text-xs text-error hover:bg-error-bg gap-1.5 h-auto py-1 px-2 font-medium"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear all history</span>
              </Button>
            </div>
          )}

          {analyses.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <Calendar className="w-8 h-8 text-muted mx-auto" />
              <p className="text-xs font-semibold text-emerald-dark">No Previous Scans</p>
              <p className="text-[11px] text-muted">
                Your future scans and score improvements will be tracked here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {analyses.map((item) => (
                <div
                  key={item._id}
                  className="p-3.5 rounded-ui bg-cream-input border border-border/80 flex items-center justify-between gap-3 transition-all hover:border-gold/50"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-display font-bold text-sm text-emerald-dark">
                        {item.score}/100
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-champagne border border-border text-emerald">
                        Grade {item.grade}
                      </span>
                    </div>

                    <p className="text-[11px] text-muted truncate mt-0.5">
                      {item.target?.jobTitle || "General scan"}
                    </p>
                    <p className="text-[10px] text-body/60 mt-0.5">
                      {formatDate(item.createdAt)}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        onSelectAnalysis(item._id);
                        onClose();
                      }}
                      className="text-xs p-1.5 h-auto"
                      title="View Analysis"
                    >
                      <Eye className="w-3.5 h-3.5 text-emerald" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteTargetId(item._id)}
                      disabled={isDeleting || isClearingAll}
                      className="text-xs p-1.5 h-auto text-error hover:bg-error-bg"
                      title="Delete Analysis"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Drawer Footer with Withdraw Consent Link */}
        <div className="p-4 border-t border-border/80 bg-cream-input flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowConsentConfirm(true)}
            className="text-[11px] font-semibold text-error hover:underline flex items-center gap-1.5"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Withdraw AI consent</span>
          </button>

          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            Close
          </Button>
        </div>

        {/* Single Item Delete Confirmation Modal */}
        {deleteTargetId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-dark/70 backdrop-blur-sm">
            <div className="bg-cream border border-border rounded-card p-6 max-w-sm w-full space-y-4 shadow-emerald-float animate-fadeIn">
              <h4 className="font-display text-base font-bold text-emerald-dark">
                Delete Scan
              </h4>
              <p className="text-xs text-body/80 leading-relaxed">
                Delete this scan? This cannot be undone.
              </p>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeleteTargetId(null)}
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  disabled={isDeleting}
                  onClick={async () => {
                    const idToDelete = deleteTargetId;
                    setDeleteTargetId(null);
                    onDeleteAnalysis(idToDelete);
                  }}
                >
                  {isDeleting ? "Deleting..." : "Delete scan"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Clear All History Confirmation Modal */}
        {showClearAllConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-dark/70 backdrop-blur-sm">
            <div className="bg-cream border border-border rounded-card p-6 max-w-sm w-full space-y-4 shadow-emerald-float animate-fadeIn">
              <h4 className="font-display text-base font-bold text-emerald-dark">
                Clear all history?
              </h4>
              <p className="text-xs text-body/80 leading-relaxed">
                Delete all {analyses.length} scan records? This cannot be undone.
              </p>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowClearAllConfirm(false)}
                  disabled={isClearingAll}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  disabled={isClearingAll}
                  onClick={async () => {
                    setShowClearAllConfirm(false);
                    onClearAllAnalyses();
                  }}
                >
                  {isClearingAll ? "Clearing..." : "Clear all"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Consent Withdrawal Confirmation Modal */}
        {showConsentConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-dark/70 backdrop-blur-sm">
            <div className="bg-cream border border-border rounded-card p-6 max-w-sm w-full space-y-4 shadow-emerald-float">
              <h4 className="font-display text-base font-bold text-emerald-dark">
                Withdraw AI Consent?
              </h4>
              <p className="text-xs text-body/80 leading-relaxed">
                Withdrawing consent will require you to explicitly review and grant consent again before running future AI resume scans.
              </p>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowConsentConfirm(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    setShowConsentConfirm(false);
                    onWithdrawConsent();
                  }}
                >
                  Confirm Withdrawal
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
