"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { adminApi } from "../services/admin.api";
import { Card } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { CronRun } from "../../../types/admin";
import { ApiClientError } from "../../../config/api";
import {
  Clock,
  Play,
  RotateCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Filter,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Info,
} from "lucide-react";

const AVAILABLE_TASKS = [
  {
    id: "job-digest",
    label: "Daily Job Digest",
    schedule: "Every morning at 9:00 AM IST",
    description: "Matches unexpired jobs from the last 24h with active candidate skills.",
  },
  {
    id: "recruiter-digest",
    label: "Daily Recruiter Digest",
    schedule: "Every evening at 6:00 PM IST",
    description: "Summarizes new applicants in the last 24h & pending reviews for open jobs.",
  },
  {
    id: "job-auto-close",
    label: "Job Auto-Close",
    schedule: "Every night at 12:30 AM IST",
    description: "Soft-closes jobs whose deadline expired and notifies recruiters.",
  },
  {
    id: "profile-nudge",
    label: "Weekly Profile Nudge",
    schedule: "Every Monday at 11:00 AM IST",
    description: "Nudges candidates with <70% profile completeness who were not nudged in 14d.",
  },
];

export const ScheduledJobsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedTaskFilter, setSelectedTaskFilter] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const limit = 15;

  // Confirmation dialog state for live send
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    task: string;
    label: string;
  }>({
    open: false,
    task: "",
    label: "",
  });

  // Query: Cron Runs
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["admin", "cron-runs", page, selectedTaskFilter],
    queryFn: async () => {
      const res = await adminApi.getCronRuns({
        page,
        limit,
        ...(selectedTaskFilter ? { task: selectedTaskFilter } : {}),
      });
      return res.data;
    },
    staleTime: 10 * 1000,
  });

  // Mutation: Trigger Task
  const triggerMutation = useMutation({
    mutationFn: async ({ task, dryRun }: { task: string; dryRun: boolean }) => {
      const res = await adminApi.triggerCronTask(task, dryRun);
      return res.data as { stats?: Record<string, number>; note?: string; error?: string };
    },
    onSuccess: (result, variables) => {
      const isDry = variables.dryRun;
      const stats = result?.stats;
      const statsSummary = stats
        ? ` (Eligible: ${stats.eligible ?? 0}, Sent: ${stats.sent ?? 0}, Skipped: ${stats.skipped ?? 0})`
        : "";

      toast.success(
        `${isDry ? "Dry run simulation" : "Live send"} completed for ${variables.task}!${statsSummary}`
      );
      queryClient.invalidateQueries({ queryKey: ["admin", "cron-runs"] });
    },
    onError: (err: unknown) => {
      if (err instanceof ApiClientError) {
        if (err.statusCode === 401) {
          toast.error("Unauthorized: Please sign in as an administrator.");
        } else if (err.statusCode === 403) {
          toast.error("Forbidden: Administrator privileges required.");
        } else if (err.statusCode === 429) {
          toast.error("Rate limit reached. Please wait before triggering another task.");
        } else {
          toast.error(err.message || "Failed to trigger cron task.");
        }
      } else {
        toast.error("Failed to trigger cron task. Please try again.");
      }
    },
  });

  const handleTrigger = (task: string, dryRun: boolean) => {
    if (dryRun) {
      triggerMutation.mutate({ task, dryRun: true });
    } else {
      const taskMeta = AVAILABLE_TASKS.find((t) => t.id === task);
      setConfirmDialog({
        open: true,
        task,
        label: taskMeta?.label || task,
      });
    }
  };

  const handleConfirmLiveSend = () => {
    if (!confirmDialog.task) return;
    const task = confirmDialog.task;
    setConfirmDialog({ open: false, task: "", label: "" });
    triggerMutation.mutate({ task, dryRun: false });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "done":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-success-bg text-success border border-success-border">
            <CheckCircle2 className="w-3 h-3" /> Done
          </span>
        );
      case "running":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gold-light text-gold-hover border border-gold/40 animate-pulse">
            <RotateCw className="w-3 h-3 animate-spin" /> Running
          </span>
        );
      case "failed":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-error-bg text-error border border-error-border">
            <XCircle className="w-3 h-3" /> Failed
          </span>
        );
      case "skipped":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-muted/10 text-muted border border-border">
            <HelpCircle className="w-3 h-3" /> Skipped
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-muted/10 text-muted">
            {status}
          </span>
        );
    }
  };

  const formatDuration = (start: string, end: string | null) => {
    if (!end) return "In progress...";
    const ms = new Date(end).getTime() - new Date(start).getTime();
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-emerald">
            Scheduled Jobs &amp; Email Automation
          </h1>
          <p className="text-sm text-body/75 mt-1">
            Monitor automated email cron jobs, review send stats, and trigger tasks on demand.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          className="gap-2 self-start sm:self-auto"
        >
          <RotateCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`} />
          Refresh Runs
        </Button>
      </div>

      {/* Trigger Tasks Grid */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-gold" />
          <h2 className="font-heading text-base font-bold text-emerald">Available Scheduled Tasks</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {AVAILABLE_TASKS.map((t) => {
            const isPendingThis =
              triggerMutation.isPending && triggerMutation.variables?.task === t.id;

            return (
              <Card
                key={t.id}
                className="p-5 bg-cream border-border flex flex-col justify-between space-y-4 hover:border-gold/50 transition-all shadow-emerald-sm"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h3 className="font-heading text-base font-bold text-emerald">{t.label}</h3>
                    <code className="text-[11px] px-2 py-0.5 rounded bg-champagne/40 text-emerald font-mono border border-border/60">
                      {t.id}
                    </code>
                  </div>
                  <p className="text-xs text-gold font-medium mb-2">{t.schedule}</p>
                  <p className="text-xs text-body/70 leading-relaxed">{t.description}</p>
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-border/40">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTrigger(t.id, true)}
                    disabled={triggerMutation.isPending}
                    isLoading={isPendingThis && triggerMutation.variables?.dryRun}
                    className="flex-1 text-xs gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-gold" />
                    Dry Run
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleTrigger(t.id, false)}
                    disabled={triggerMutation.isPending}
                    isLoading={isPendingThis && !triggerMutation.variables?.dryRun}
                    className="flex-1 text-xs gap-1.5"
                  >
                    <Play className="w-3.5 h-3.5" />
                    Send Live
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Recent Runs History */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-emerald" />
            <h2 className="font-heading text-base font-bold text-emerald">Execution History</h2>
          </div>

          {/* Filter dropdown */}
          <div className="flex items-center gap-2">
            <label htmlFor="task-filter" className="text-xs text-body/70 font-medium">
              Filter by Task:
            </label>
            <select
              id="task-filter"
              value={selectedTaskFilter}
              onChange={(e) => {
                setSelectedTaskFilter(e.target.value);
                setPage(1);
              }}
              className="text-xs px-3 py-1.5 rounded-ui bg-cream border border-border text-body focus:outline-none focus:ring-2 focus:ring-gold"
            >
              <option value="">All Tasks</option>
              {AVAILABLE_TASKS.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Content table */}
        <Card className="p-0 overflow-hidden bg-cream border-border shadow-emerald-sm">
          {isLoading ? (
            <div className="p-12 text-center space-y-3">
              <RotateCw className="w-8 h-8 text-gold animate-spin mx-auto" />
              <p className="text-sm text-body/70">Loading cron execution history...</p>
            </div>
          ) : isError ? (
            <div className="p-8 text-center space-y-3 text-error">
              <AlertTriangle className="w-8 h-8 mx-auto" />
              <p className="text-sm font-semibold">
                {error instanceof Error ? error.message : "Failed to load execution history."}
              </p>
              <Button variant="outline" size="sm" onClick={() => refetch()} className="mx-auto">
                Retry
              </Button>
            </div>
          ) : !data?.runs || data.runs.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <Clock className="w-8 h-8 text-muted/40 mx-auto" />
              <p className="text-sm text-body/70 font-medium">No recorded runs found.</p>
              <p className="text-xs text-muted">
                Runs triggered via external endpoints, internal scheduler, or manual admin triggers
                will show up here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-champagne/40 border-b border-border text-emerald font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Task &amp; Key</th>
                    <th className="py-3 px-4">Started At</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Mode</th>
                    <th className="py-3 px-4">Duration</th>
                    <th className="py-3 px-4">Stats</th>
                    <th className="py-3 px-4">Notes / Error</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {data.runs.map((run: CronRun) => {
                    const taskName =
                      AVAILABLE_TASKS.find((t) => t.id === run.task)?.label || run.task;

                    return (
                      <tr key={run._id} className="hover:bg-champagne/20 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-emerald text-sm">{taskName}</div>
                          <div className="text-[11px] text-muted font-mono truncate max-w-xs">
                            {run.key}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-body/80 whitespace-nowrap">
                          {new Date(run.startedAt).toLocaleString("en-IN", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {getStatusBadge(run.status)}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {run.dryRun ? (
                            <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-champagne text-emerald border border-border">
                              Dry Run
                            </span>
                          ) : (
                            <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald text-white">
                              Live
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap font-mono text-body/80">
                          {formatDuration(run.startedAt, run.finishedAt)}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-2 text-[11px]">
                            <span className="text-body font-medium">
                              Eligible: <strong>{run.stats?.eligible ?? 0}</strong>
                            </span>
                            <span className="text-success font-medium">
                              Sent: <strong>{run.stats?.sent ?? 0}</strong>
                            </span>
                            <span className="text-muted font-medium">
                              Skip: <strong>{run.stats?.skipped ?? 0}</strong>
                            </span>
                            {run.stats?.failed > 0 && (
                              <span className="text-error font-bold">
                                Fail: {run.stats.failed}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 max-w-xs">
                          {run.error ? (
                            <span
                              className="text-error truncate block text-xs"
                              title={run.error}
                            >
                              {run.error}
                            </span>
                          ) : (
                            <span className="text-muted/60 text-xs">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {data?.totalPages && data.totalPages > 1 && (
            <div className="p-3 bg-champagne/30 border-t border-border flex items-center justify-between">
              <span className="text-xs text-muted">
                Showing page {data.page} of {data.totalPages} ({data.total} total runs)
              </span>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="h-7 px-2"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </Button>
                <span className="text-xs font-semibold text-emerald px-2">{page}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                  disabled={page >= data.totalPages}
                  className="h-7 px-2"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Confirmation Dialog for Live Send */}
      {confirmDialog.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <Card className="max-w-md w-full p-6 bg-cream border-border shadow-emerald-lg space-y-4">
            <div className="flex items-center gap-2.5 text-error">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="font-heading text-lg font-bold text-emerald">
                Confirm Live Email Send
              </h3>
            </div>

            <p className="text-sm text-body/85 leading-relaxed">
              You are about to run <strong>{confirmDialog.label}</strong> in <strong>LIVE</strong>{" "}
              mode.
            </p>

            <div className="p-3 rounded-xl bg-champagne/40 border border-border/80 text-xs text-body/80 space-y-1">
              <p className="font-semibold text-emerald flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-gold" /> Daily Email Limit Notice
              </p>
              <p>
                All emails sent count toward your daily quota (default: 250/day) to preserve headroom
                for critical transactional emails (OTP, password reset, and status updates).
              </p>
            </div>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-border/60">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmDialog({ open: false, task: "", label: "" })}
                disabled={triggerMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmLiveSend}
                isLoading={triggerMutation.isPending}
                className="gap-1.5"
              >
                <Play className="w-3.5 h-3.5" />
                Yes, Send For Real
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

