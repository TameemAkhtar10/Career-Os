import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../../config/api";
import { Job } from "../../../types/job";
import { Target, Search, FileText, CheckCircle2 } from "lucide-react";

interface TargetJobSelectorProps {
  mode: "none" | "job" | "description";
  onModeChange: (mode: "none" | "job" | "description") => void;
  selectedJobId: string;
  onSelectJobId: (id: string) => void;
  jobDescription: string;
  onJobDescriptionChange: (val: string) => void;
  disabled?: boolean;
}

export const TargetJobSelector: React.FC<TargetJobSelectorProps> = ({
  mode,
  onModeChange,
  selectedJobId,
  onSelectJobId,
  jobDescription,
  onJobDescriptionChange,
  disabled = false,
}) => {
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch open jobs when in job mode
  const { data: jobsData, isLoading: isLoadingJobs } = useQuery({
    queryKey: ["open-jobs-target"],
    queryFn: async () => {
      const res = await apiClient<{ jobs: Job[]; total: number }>("/api/jobs?limit=50");
      return res.data?.jobs || [];
    },
    enabled: mode === "job",
  });

  const filteredJobs = (jobsData || []).filter((j) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      j.title.toLowerCase().includes(q) ||
      j.companyName.toLowerCase().includes(q) ||
      (j.skills || []).some((s) => s.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-4">
      {/* Mode Switcher Buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => onModeChange("none")}
          disabled={disabled}
          className={`px-3.5 py-1.5 rounded-ui text-xs font-semibold transition-all ${
            mode === "none"
              ? "bg-emerald text-white shadow-emerald-sm"
              : "bg-cream text-body/80 border border-border hover:bg-champagne/60"
          }`}
        >
          General scan
        </button>

        <button
          type="button"
          onClick={() => onModeChange("job")}
          disabled={disabled}
          className={`px-3.5 py-1.5 rounded-ui text-xs font-semibold transition-all flex items-center gap-1.5 ${
            mode === "job"
              ? "bg-emerald text-white shadow-emerald-sm"
              : "bg-cream text-body/80 border border-border hover:bg-champagne/60"
          }`}
        >
          <Target className="w-3.5 h-3.5" />
          <span>Match Open Job</span>
        </button>

        <button
          type="button"
          onClick={() => onModeChange("description")}
          disabled={disabled}
          className={`px-3.5 py-1.5 rounded-ui text-xs font-semibold transition-all flex items-center gap-1.5 ${
            mode === "description"
              ? "bg-emerald text-white shadow-emerald-sm"
              : "bg-cream text-body/80 border border-border hover:bg-champagne/60"
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Paste Job Description</span>
        </button>
      </div>

      {/* Target: Open Job Selection */}
      {mode === "job" && (
        <div className="p-4 rounded-ui bg-cream border border-border space-y-3 animate-fadeIn">
          <div className="relative">
            <Search className="w-4 h-4 text-emerald absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search open positions by role, company, or skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={disabled}
              className="w-full pl-9 pr-4 py-2 bg-cream-input rounded-ui border border-border/80 text-xs text-body placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-gold"
            />
          </div>

          {isLoadingJobs ? (
            <p className="text-xs text-muted py-3 text-center">Loading open roles...</p>
          ) : filteredJobs.length === 0 ? (
            <p className="text-xs text-muted py-3 text-center">No open positions matched your search.</p>
          ) : (
            <div className="max-h-52 overflow-y-auto space-y-2 pr-1">
              {filteredJobs.map((j) => {
                const isSelected = selectedJobId === j._id;
                return (
                  <div
                    key={j._id}
                    onClick={() => onSelectJobId(j._id)}
                    className={`p-2.5 rounded-ui border cursor-pointer transition-all flex items-center justify-between gap-3 text-xs ${
                      isSelected
                        ? "bg-champagne border-emerald font-semibold text-emerald-dark"
                        : "bg-cream-input border-border/60 hover:bg-champagne/40 text-body"
                    }`}
                  >
                    <div>
                      <p className="font-bold text-emerald-dark">{j.title}</p>
                      <p className="text-[11px] text-muted">
                        {j.companyName} · {j.location?.city || "Remote"}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald" />}
                      <span className="text-[10px] bg-white/80 border border-border px-2 py-0.5 rounded-full text-muted">
                        {(j.skills || []).length} skills
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Target: Paste Job Description */}
      {mode === "description" && (
        <div className="p-4 rounded-ui bg-cream border border-border space-y-2 animate-fadeIn">
          <div className="flex items-center justify-between text-xs text-muted">
            <span className="font-semibold text-emerald-dark">Target Role Requirements</span>
            <span className="tabular-nums">
              {jobDescription.length} / 6000 characters
            </span>
          </div>

          <textarea
            rows={4}
            maxLength={6000}
            placeholder="Paste the target job description or requirements here to analyze keyword alignment and skill gaps..."
            value={jobDescription}
            onChange={(e) => onJobDescriptionChange(e.target.value)}
            disabled={disabled}
            className="w-full p-3 bg-cream-input rounded-ui border border-border/80 text-xs text-body placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-gold leading-relaxed resize-y"
          />
        </div>
      )}
    </div>
  );
};
