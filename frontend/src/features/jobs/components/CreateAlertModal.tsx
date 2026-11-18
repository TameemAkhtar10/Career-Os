"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "../../../components/ui/Modal";
import { Button } from "../../../components/ui/Button";
import { useCreateJobAlert } from "../hooks/useJobAlerts";
import { JobAlertFilters } from "../../../types/job";
import { useAuth } from "../../../providers/AuthProvider";
import { Bell, Sparkles, Check, Clock, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export interface CreateAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: JobAlertFilters;
}

export const CreateAlertModal: React.FC<CreateAlertModalProps> = ({
  isOpen,
  onClose,
  filters,
}) => {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const createAlertMutation = useCreateJobAlert();

  // Generate initial default name
  const getDefaultName = (f: JobAlertFilters) => {
    const parts: string[] = [];
    if (f.q?.trim()) parts.push(f.q.trim());
    else if (f.skills && f.skills.length > 0) parts.push(f.skills[0]);
    else if (f.fresher) parts.push("Fresher Jobs");
    else parts.push("Curated Roles");

    if (f.location?.trim()) {
      parts.push(`in ${f.location.trim()}`);
    } else if (f.workMode) {
      parts.push(`(${f.workMode})`);
    }

    return parts.join(" ");
  };

  const [name, setName] = useState("");
  const [frequency, setFrequency] = useState<"daily" | "weekly">("daily");

  useEffect(() => {
    if (isOpen) {
      setName(getDefaultName(filters));
      setFrequency("daily");
    }
  }, [isOpen, filters]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      toast.info("Please sign in as a candidate to create job alerts.");
      router.push("/login?next=/jobs");
      return;
    }

    if (user?.role !== "candidate") {
      toast.error("Only candidates can create job alerts.");
      return;
    }

    if (!name.trim()) {
      toast.error("Please provide an alert name.");
      return;
    }

    try {
      await createAlertMutation.mutateAsync({
        name: name.trim(),
        filters,
        frequency,
      });
      onClose();
    } catch {
      // Error handled by mutation onError
    }
  };

  const activeFiltersSummary: { label: string; value: string }[] = [];
  if (filters.q?.trim()) activeFiltersSummary.push({ label: "Keyword", value: filters.q.trim() });
  if (filters.location?.trim()) activeFiltersSummary.push({ label: "City", value: filters.location.trim() });
  if (filters.workMode) activeFiltersSummary.push({ label: "Mode", value: filters.workMode });
  if (filters.jobType) activeFiltersSummary.push({ label: "Type", value: filters.jobType.replace("_", " ") });
  if (filters.skills && filters.skills.length > 0) activeFiltersSummary.push({ label: "Skills", value: filters.skills.join(", ") });
  if (filters.fresher) activeFiltersSummary.push({ label: "Experience", value: "Fresher Friendly" });
  if (filters.minSalary) activeFiltersSummary.push({ label: "Min Salary", value: `₹${Math.round(filters.minSalary / 100000)} LPA+` });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Job Alert from Search"
      description="Receive timely email notifications whenever new verified roles matching these filters are posted."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Active Filters Summary Card */}
        <div className="p-3.5 rounded-ui bg-champagne/40 border border-border/80 space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted block">
            Target Search Filters
          </span>
          <div className="flex flex-wrap gap-1.5">
            {activeFiltersSummary.map((item, idx) => (
              <span
                key={idx}
                className="text-xs px-2.5 py-1 rounded-ui bg-cream border border-border/70 text-emerald-dark font-medium"
              >
                <strong>{item.label}:</strong> {item.value}
              </span>
            ))}
          </div>
        </div>

        {/* Alert Name */}
        <div className="space-y-1.5">
          <label htmlFor="alertName" className="block text-xs font-bold uppercase tracking-wider text-emerald-dark">
            Alert Name
          </label>
          <input
            id="alertName"
            type="text"
            required
            maxLength={100}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Full Stack Remote Freshers"
            className="w-full px-3 py-2 bg-cream-input border border-border rounded-ui text-sm focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20"
          />
        </div>

        {/* Frequency Choice */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold uppercase tracking-wider text-emerald-dark">
            Notification Frequency
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setFrequency("daily")}
              className={`p-3 rounded-ui border text-left transition-all ${
                frequency === "daily"
                  ? "border-emerald bg-champagne/60 text-emerald-dark shadow-emerald-sm"
                  : "border-border bg-cream text-body hover:bg-champagne/30"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold">Daily Digest</span>
                {frequency === "daily" && <Check className="w-3.5 h-3.5 text-emerald" />}
              </div>
              <p className="text-[11px] text-muted">
                Sent once per day when new matching roles arrive.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setFrequency("weekly")}
              className={`p-3 rounded-ui border text-left transition-all ${
                frequency === "weekly"
                  ? "border-emerald bg-champagne/60 text-emerald-dark shadow-emerald-sm"
                  : "border-border bg-cream text-body hover:bg-champagne/30"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold">Weekly Digest</span>
                {frequency === "weekly" && <Check className="w-3.5 h-3.5 text-emerald" />}
              </div>
              <p className="text-[11px] text-muted">
                Sent once a week summarizing new openings.
              </p>
            </button>
          </div>
        </div>

        <div className="p-3 rounded-ui bg-cream border border-border/70 text-[11px] text-muted leading-relaxed">
          💡 You can create up to 5 alerts. Each alert includes a 1-click pause link in every email.
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={createAlertMutation.isPending}
            className="gap-1.5 shadow-md"
          >
            <Bell className="w-3.5 h-3.5" />
            <span>{createAlertMutation.isPending ? "Creating..." : "Save Job Alert"}</span>
          </Button>
        </div>
      </form>
    </Modal>
  );
};
