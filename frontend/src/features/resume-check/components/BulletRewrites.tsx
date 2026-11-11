import React, { useState } from "react";
import { BulletRewrite } from "../types";
import { Card } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { Sparkles, ArrowRight, Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface BulletRewritesProps {
  rewrites: BulletRewrite[];
}

export const BulletRewrites: React.FC<BulletRewritesProps> = ({ rewrites }) => {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  if (!rewrites || rewrites.length === 0) return null;

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    toast.success("Improved bullet copied!");
    setTimeout(() => {
      setCopiedIdx(null);
    }, 2000);
  };

  return (
    <Card className="p-5 sm:p-6 bg-cream border-border shadow-emerald-sm space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-gold shrink-0" />
        <div>
          <h3 className="font-display text-base sm:text-lg font-bold text-emerald-dark">
            High-Impact Bullet Point Rewrites
          </h3>
          <p className="text-xs text-muted">
            Transform passive descriptions into recruiter-ready achievement statements.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {rewrites.slice(0, 3).map((item, idx) => (
          <div
            key={idx}
            className="p-4 rounded-ui bg-cream-input border border-border/80 space-y-3"
          >
            {/* Original vs Improved */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-stretch">
              {/* Original */}
              <div className="p-3 rounded-ui bg-error-bg/30 border border-error-border/60 space-y-1">
                <span className="text-[10px] uppercase font-bold text-error tracking-wider block">
                  Original Phrasing:
                </span>
                <p className="text-xs text-body/80 leading-relaxed italic">
                  &ldquo;{item.original}&rdquo;
                </p>
              </div>

              {/* Improved */}
              <div className="p-3 rounded-ui bg-success-bg/30 border border-success-border/60 space-y-2 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-success tracking-wider block mb-1">
                    Stronger Impact Version:
                  </span>
                  <p className="text-xs font-semibold text-emerald-dark leading-relaxed">
                    &ldquo;{item.improved}&rdquo;
                  </p>
                </div>

                <div className="pt-2 flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy(item.improved, idx)}
                    className="text-xs gap-1.5 bg-white hover:bg-success-bg/40 text-emerald-dark"
                  >
                    {copiedIdx === idx ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-success" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-muted" />
                        <span>Copy</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Why it's stronger */}
            <div className="text-xs text-body/75 bg-champagne/20 p-2.5 rounded-ui border border-border/50 flex items-center gap-2">
              <span className="font-bold text-gold shrink-0">Why this works:</span>
              <span className="leading-relaxed">{item.reason}</span>
            </div>

            {/* Optional metric placeholder hint */}
            {item.metricHint && item.metricHint.trim() && (
              <div className="text-xs text-emerald-dark bg-emerald/5 p-2.5 rounded-ui border border-emerald/20 flex items-center gap-2">
                <span className="font-bold text-emerald shrink-0">Tip:</span>
                <span className="leading-relaxed">{item.metricHint}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
};

