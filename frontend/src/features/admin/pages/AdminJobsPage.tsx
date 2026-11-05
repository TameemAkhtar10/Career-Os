"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "../services/admin.api";
import { AdminJob } from "../../../types/admin";
import { Card } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { Skeleton } from "../../../components/ui/Skeleton";
import { Pagination } from "../../../components/ui/Pagination";
import { toast } from "sonner";
import { Search } from "lucide-react";

const JOB_STATUSES = ["all", "open", "closed", "draft"] as const;

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export const AdminJobsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState("all");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const debouncedQ = useDebounce(q, 400);

  const [confirmTarget, setConfirmTarget] = useState<{ job: AdminJob; newStatus: "open" | "closed" | "draft" } | null>(null);

  const { data: res, isLoading } = useQuery({
    queryKey: ["admin", "jobs", status, debouncedQ, page],
    queryFn: () =>
      adminApi.getJobs({
        status: status === "all" ? undefined : status,
        q: debouncedQ || undefined,
        page,
        limit: 15,
      }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, newStatus }: { id: string; newStatus: "open" | "closed" | "draft" }) =>
      adminApi.updateJobStatus(id, newStatus),
    onSuccess: () => {
      toast.success("Job status updated.");
      queryClient.invalidateQueries({ queryKey: ["admin", "jobs"] });
    },
    onError: () => toast.error("Failed to update job status."),
  });

  const jobs = res?.data?.jobs ?? [];
  const totalPages = res?.data?.totalPages ?? 1;

  const statusColor = (s: string) => {
    switch (s) {
      case "open": return "bg-emerald/10 text-emerald-dark";
      case "closed": return "bg-error-bg text-error-red";
      case "draft": return "bg-champagne text-body-text/70";
      default: return "bg-champagne text-body-text/70";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-emerald-ink">Job Management</h1>
        <p className="text-sm text-body-text/70 mt-1">
          {res?.data?.total != null ? `${res.data.total} jobs total` : ""}
        </p>
      </div>

      {/* Filters */}
      <Card className="p-4 bg-cream border-champagne-border">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-body-text/40" />
            <input
              type="text"
              placeholder="Search by title or company..."
              value={q}
              onChange={(e) => { setQ(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-xl bg-champagne/20 border border-champagne-border text-body-text placeholder:text-body-text/40 focus:outline-none focus:ring-2 focus:ring-gold-accent"
            />
          </div>
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="text-sm px-3 py-2 rounded-xl border border-champagne-border bg-cream focus:outline-none focus:ring-2 focus:ring-gold-accent"
          >
            {JOB_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s === "all" ? "All Statuses" : s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* Table */}
      <Card className="bg-cream border-champagne-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-champagne/30 border-b border-champagne-border">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-emerald-ink">Title</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-emerald-ink">Company</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-emerald-ink">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-emerald-ink">Applicants</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-emerald-ink">Posted</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-emerald-ink">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="border-b border-champagne-border/40">
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>
                      ))}
                    </tr>
                  ))
                : jobs.map((job) => (
                    <tr key={job._id} className="border-b border-champagne-border/40 hover:bg-champagne/10">
                      <td className="px-4 py-3 font-medium text-emerald-ink max-w-xs truncate">{job.title}</td>
                      <td className="px-4 py-3 text-xs text-body-text/70">{job.companyName}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${statusColor(job.status)}`}>
                          {job.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-body-text/70">{job.applicantCount}</td>
                      <td className="px-4 py-3 text-xs text-body-text/60">
                        {new Date(job.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {(["open", "closed", "draft"] as const)
                            .filter((s) => s !== job.status)
                            .map((s) => (
                              <Button
                                key={s}
                                variant="ghost"
                                size="sm"
                                className="text-xs"
                                onClick={() => setConfirmTarget({ job, newStatus: s })}
                                disabled={statusMutation.isPending}
                              >
                                → {s}
                              </Button>
                            ))}
                        </div>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>

          {!isLoading && jobs.length === 0 && (
            <div className="text-center py-12 text-sm text-body-text/60">No jobs found.</div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="p-4 border-t border-champagne-border flex justify-center">
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}
      </Card>

      {/* Confirm Status Dialog */}
      {confirmTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-cream border border-champagne-border rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl space-y-4">
            <h3 className="font-heading text-lg font-bold text-emerald-ink">
              Change Job Status to "{confirmTarget.newStatus}"?
            </h3>
            <p className="text-sm text-body-text/70">
              Job: <strong>{confirmTarget.job.title}</strong>
              {confirmTarget.newStatus === "closed" && (
                <span className="block mt-1 text-error-red text-xs">
                  Closing this job will stop new applications.
                </span>
              )}
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setConfirmTarget(null)} disabled={statusMutation.isPending}>
                Cancel
              </Button>
              <Button
                variant={confirmTarget.newStatus === "closed" ? "danger" : "primary"}
                isLoading={statusMutation.isPending}
                onClick={() => {
                  statusMutation.mutate({ id: confirmTarget.job._id, newStatus: confirmTarget.newStatus });
                  setConfirmTarget(null);
                }}
              >
                Confirm
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

