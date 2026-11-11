import React, { useState } from "react";
import { Suggestion } from "../types";
import { Card } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { Lightbulb, Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface TopSuggestionsProps {
  suggestions: Suggestion[];
}

export const TopSuggestions: React.FC<TopSuggestionsProps> = ({ suggestions }) => {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  if (!suggestions || suggestions.length === 0) return null;

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    toast.success("Example copied to clipboard!");
    setTimeout(() => {
      setCopiedIdx(null);
    }, 2000);
  };

  return (
    <Card className="p-5 sm:p-6 bg-cream border-border shadow-emerald-sm space-y-4">
      <div className="flex items-center gap-2">
        <Lightbulb className="w-5 h-5 text-gold shrink-0" />
        <h3 className="font-display text-base sm:text-lg font-bold text-emerald-dark">
          Targeted AI Optimization Suggestions
        </h3>
      </div>

      <div className="space-y-4">
        {suggestions.map((item, idx) => {
          let priorityClass = "bg-error-bg text-error border-error-border";
          if (item.priority === "medium") {
            priorityClass = "bg-champagne/60 text-gold-hover border-gold/40";
          } else if (item.priority === "low") {
            priorityClass = "bg-cream-input text-muted border-border";
          }

          return (
            <div
              key={idx}
              className="p-4 rounded-ui bg-cream-input border border-border/80 space-y-3 transition-all hover:border-gold/50"
            >
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-sm font-bold text-emerald-dark">
                  {item.title}
                </span>
                <span
                  className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full border ${priorityClass}`}
                >
                  {item.priority} priority
                </span>
              </div>

              <p className="text-xs text-body/80 leading-relaxed">
                {item.description}
              </p>

              {item.example && (
                <div className="p-3 rounded-ui bg-champagne/30 border border-border/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="text-xs font-mono text-emerald-dark overflow-x-auto">
                    <span className="text-[10px] uppercase font-sans font-bold text-gold block mb-0.5">
                      Suggested Phrasing Example:
                    </span>
                    &ldquo;{item.example}&rdquo;
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy(item.example, idx)}
                    className="text-xs gap-1.5 shrink-0 self-end sm:self-auto bg-white hover:bg-champagne/40"
                  >
                    {copiedIdx === idx ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-success" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-muted" />
                        <span>Copy Example</span>
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
};

