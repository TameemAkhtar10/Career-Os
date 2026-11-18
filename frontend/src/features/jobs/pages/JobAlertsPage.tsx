"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  useJobAlerts,
  useUpdateJobAlert,
  useDeleteJobAlert,
  usePauseAlertWithToken,
} from "../hooks/useJobAlerts";
import { Card } from "../../../components/ui/Card";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { EmptyState } from "../../../components/feedback/EmptyState";
import { BrandLoader } from "../../../components/feedback/BrandLoader";
import { ROUTES } from "../../../constants/routes";
import {
  Bell,
  Trash2,
  Play,
  Pause,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Sliders,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";

export const JobAlertsPage: React.FC = () => {
  const searchParams = useSearchParams();
  const pauseToken = searchParams.get("pauseToken");

  const { data: alerts = [], isLoading } = useJobAlerts();
  const updateAlertMutation = useUpdateJobAlert();
  const deleteAlertMutation = useDeleteJobAlert();
  const pauseWithTokenMutation = usePauseAlertWithToken();

  const [pausedViaTokenMessage, setPausedViaTokenMessage] = useState<string | null>(null);

  // Handle one-click pause via email link token
  useEffect(() => {
    if (pauseToken) {
      pauseWithTokenMutation
        .mutateAsync(pauseToken)
        .then((res) => {
          setPausedViaTokenMessage(res.message || "Your job alert has been successfully paused.");
        })
        .catch(() => {
          // Toast handled by mutation
        });
    }
  }, [pauseToken]);

  if (isLoading) {
    return <BrandLoader message="Loading your job alerts..." />;
  }

  const activeCount = alerts.filter((a) => a.active).length;

  return (
    <div className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      {/* Page Header */}
      <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/60 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-badge bg-champagne border border-border text-emerald text-xs font-semibold mb-2">
            <Bell className="w-3.5 h-3.5 text-gold" />
            <span>Search Notifications</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-emerald-dark tracking-tight">
            Job Alerts
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-1">
            Automated alerts matching your exact query criteria sent directly to your inbox.
          </p>
        </div>

        {/* 5-alert Limit Counter */}
        <div className="px-3.5 py-2 rounded-ui bg-cream border border-border text-xs space-y-0.5">
          <div className="flex items-center justify-between gap-3 font-semibold text-emerald-dark">
            <span>Alerts Used:</span>
            <span className="tabular-nums font-bold text-sm">
              {alerts.length} / 5
            </span>
          </div>
          <p className="text-[10px] text-muted">
            {5 - alerts.length > 0
              ? `${5 - alerts.length} alert slots remaining`
              : "Maximum limit reached"}
          </p>
        </div>
      </div>

      {/* Token Pause Notice */}
      {pausedViaTokenMessage && (
        <div className="mb-6 p-4 rounded-card bg-champagne/80 border border-gold/60 flex items-center gap-3 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald shrink-0" />
          <div className="text-xs text-emerald-dark">
            <p className="font-bold">Alert Updated</p>
            <p>{pausedViaTokenMessage}</p>
          </div>
        </div>
      )}

      {/* Alerts List or Empty State */}
      {alerts.length === 0 ? (
        <EmptyState
          title="No job alerts created yet"
          message="Filter jobs by role, location, or salary on the Jobs page, then click 'Create alert from this search' to never miss a fresh opening."
          actionText="Search Jobs & Set Alert"
          actionHref={ROUTES.JOBS}
        />
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => {
            const filters = alert.filters || {};
            const filterTags: string[] = [];
            if (filters.q) filterTags.push(`"${filters.q}"`);
            if (filters.location) filterTags.push(filters.location);
            if (filters.workMode) filterTags.push(filters.workMode);
            if (filters.jobType) filterTags.push(filters.jobType.replace("_", " "));
            if (filters.skills && filters.skills.length > 0) filterTags.push(...filters.skills);
            if (filters.fresher) filterTags.push("Fresher Friendly");
            if (filters.minSalary) filterTags.push(`₹${Math.round(filters.minSalary / 100000)} LPA+`);

            return (
              <Card
                key={alert._id}
                className={`p-5 sm:p-6 bg-cream border transition-all ${
                  alert.active
                    ? "border-border shadow-emerald-sm hover:border-gold/40"
                    : "border-border/60 opacity-80 bg-cream/60"
                }`}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="font-display text-lg sm:text-xl font-bold text-emerald-dark">
                        {alert.name}
                      </h2>
                      {alert.active ? (
                        <Badge variant="fresher" size="sm" className="gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" size="sm" className="text-muted border-muted">
                          Paused
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-muted pt-0.5">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-gold" />
                        Frequency: <strong className="capitalize text-body">{alert.frequency}</strong>
                      </span>
                      <span>&bull;</span>
                      <span>
                        {alert.lastSentAt
                          ? `Last sent ${new Date(alert.lastSentAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                            })}`
                          : "Scheduled for next run"}
                      </span>
                    </div>
                  </div>

                  {/* Actions: Pause/Resume Toggle, Frequency Selector, Delete */}
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                    {/* Frequency Dropdown */}
                    <select
                      value={alert.frequency}
                      disabled={updateAlertMutation.isPending}
                      onChange={(e) =>
                        updateAlertMutation.mutate({
                          id: alert._id,
                          data: { frequency: e.target.value as "daily" | "weekly" },
                        })
                      }
                      className="px-2.5 py-1 text-xs rounded-ui bg-cream-input border border-border font-medium text-emerald-dark cursor-pointer focus:outline-none focus:border-gold"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                    </select>

                    {/* Pause / Resume Button */}
                    <Button
                      size="sm"
                      variant={alert.active ? "outline" : "primary"}
                      disabled={updateAlertMutation.isPending}
                      onClick={() =>
                        updateAlertMutation.mutate({
                          id: alert._id,
                          data: { active: !alert.active },
                        })
                      }
                      className="gap-1 text-xs"
                    >
                      {alert.active ? (
                        <>
                          <Pause className="w-3 h-3" />
                          <span>Pause</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3 h-3" />
                          <span>Resume</span>
                        </>
                      )}
                    </Button>

                    {/* Delete Alert Button */}
                    <button
                      type="button"
                      aria-label="Delete alert"
                      disabled={deleteAlertMutation.isPending}
                      onClick={() => {
                        if (confirm(`Are you sure you want to delete the "${alert.name}" alert?`)) {
                          deleteAlertMutation.mutate(alert._id);
                        }
                      }}
                      className="p-1.5 rounded-ui text-muted hover:text-error hover:bg-error-bg/60 transition-colors"
                      title="Delete alert"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Filter Tags */}
                <div className="pt-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted block mb-1.5">
                    Matching Criteria
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {filterTags.length > 0 ? (
                      filterTags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="text-[11px] px-2 py-0.5 rounded-ui bg-white/80 border border-border/60 text-body font-medium capitalize"
                        >
                          {tag}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-muted italic">All open roles</span>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
