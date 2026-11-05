"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMyApplications, useWithdrawApplication } from "../hooks/useApplications";
import { Application, StatusHistoryItem } from "../../../types/application";
import { Card } from "../../../components/ui/Card";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { Tabs, TabItem } from "../../../components/ui/Tabs";
import { Modal } from "../../../components/ui/Modal";
import { Skeleton } from "../../../components/ui/Skeleton";
import { Pagination } from "../../../components/ui/Pagination";
import { EmptyState } from "../../../components/feedback/EmptyState";
import { toast } from "sonner";
import {
  Building2,
  MapPin,
  
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  FileText,
  MessageSquare,
  CheckCircle,
  XCircle,
  HelpCircle,
} from "lucide-react";

type ApplicationFilterTab = "all" | "applied" | "shortlisted" | "hired" | "rejected" | "withdrawn";

export const MyApplicationsPage: React.FC = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ApplicationFilterTab>("all");
  const [page, setPage] = useState(1);
  const [selectedAppToWithdraw, setSelectedAppToWithdraw] = useState<Application | null>(null);
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({});

  const { data, isLoading, isError } = useMyApplications({
    status: activeTab === "all" ? undefined : activeTab,
    page,
    limit: 10,
  });

  const withdrawMutation = useWithdrawApplication();

  const tabs: TabItem<ApplicationFilterTab>[] = [
    { id: "all", label: "All" },
    { id: "applied", label: "Applied" },
    { id: "shortlisted", label: "Shortlisted" },
    { id: "hired", label: "Hired" },
    { id: "rejected", label: "Rejected" },
    { id: "withdrawn", label: "Withdrawn" },
  ];

  const toggleExpand = (appId: string) => {
    setExpandedNotes((prev) => ({ ...prev, [appId]: !prev[appId] }));
  };

  const handleWithdrawConfirm = async () => {
    if (!selectedAppToWithdraw) return;
    try {
      await withdrawMutation.mutateAsync(selectedAppToWithdraw._id);
      toast.success("Application withdrawn successfully.");
      setSelectedAppToWithdraw(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to withdraw application.");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "applied":
        return <Badge variant="outline">Applied</Badge>;
      case "shortlisted":
        return <Badge variant="gold">Shortlisted</Badge>;
      case "hired":
        return <Badge variant="success">Hired 🎉</Badge>;
      case "rejected":
        return <Badge variant="error">Not Selected</Badge>;
      case "withdrawn":
        return <Badge variant="outline">Withdrawn</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-champagne/40 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold text-emerald-ink">
              My Applications
            </h1>
            <p className="text-sm text-body-text/70 mt-1">
              Track the progress of your job applications in real time.
            </p>
          </div>
          <Link href="/jobs">
            <Button variant="secondary" size="sm">
              Explore More Jobs
            </Button>
          </Link>
        </div>

        {/* Status Tabs */}
        <div className="bg-cream/60 p-2 rounded-2xl border border-champagne-border/80">
          <Tabs
            tabs={tabs}
            activeTab={activeTab}
            onChange={(tabId) => {
              setActiveTab(tabId);
              setPage(1);
            }}
          />
        </div>

        {/* Content Section */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-6 bg-cream border-champagne-border">
                <div className="space-y-3">
                  <Skeleton className="h-6 w-1/3" />
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </Card>
            ))}
          </div>
        ) : isError ? (
          <Card className="p-8 text-center bg-cream border-champagne-border">
            <p className="text-sm text-error-red">Failed to load applications. Please try again.</p>
          </Card>
        ) : !data || data.applications.length === 0 ? (
          <EmptyState
            title="No applications found"
            description={
              activeTab === "all"
                ? "You haven't applied to any jobs yet. Browse available jobs and apply today!"
                : `No applications found with status "${activeTab}".`
            }
            actionLabel="Browse Jobs"
            onAction={() => router.push("/jobs")}
          />
        ) : (
          <div className="space-y-4">
            {data.applications.map((app) => {
              const job = typeof app.job === "object" ? app.job : null;
              const jobId = typeof app.job === "string" ? app.job : app.job?._id;
              const canWithdraw = app.status === "applied" || app.status === "shortlisted";
              const isExpanded = expandedNotes[app._id];

              return (
                <Card
                  key={app._id}
                  className="p-6 bg-cream border-champagne-border hover:shadow-soft-emerald transition-all"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    {/* Main Info */}
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {getStatusBadge(app.status)}
                        {job && (
                          <>
                            <span className="text-xs px-2.5 py-0.5 rounded-full bg-champagne text-body-text capitalize">
                              {job.workMode}
                            </span>
                            <span className="text-xs px-2.5 py-0.5 rounded-full bg-champagne text-body-text capitalize">
                              {job.jobType?.replace("_", " ")}
                            </span>
                          </>
                        )}
                      </div>

                      <div>
                        {jobId ? (
                          <Link
                            href={`/jobs/${jobId}`}
                            className="font-heading text-lg sm:text-xl font-bold text-emerald-ink hover:text-emerald-hover transition-colors"
                          >
                            {job?.title || "Job Listing"}
                          </Link>
                        ) : (
                          <span className="font-heading text-lg sm:text-xl font-bold text-emerald-ink">
                            {job?.title || "Job Listing"}
                          </span>
                        )}
                        <div className="flex items-center gap-4 text-xs text-body-text/70 mt-1">
                          <span className="flex items-center gap-1 font-medium">
                            <Building2 className="w-3.5 h-3.5 text-gold-accent" />
                            {job?.companyName || "Company"}
                          </span>
                          {job?.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-gold-accent" />
                              {[job.location.city, job.location.state].filter(Boolean).join(", ")}
                            </span>
                          )}
                          <span className="flex items-center gap-1 text-body-text/60">
                            <Clock className="w-3.5 h-3.5" />
                            Applied on {new Date(app.createdAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Match Score Indicator */}
                      <div className="pt-2 max-w-sm">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-medium text-emerald-ink flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-gold-accent" />
                            Skills Match Score
                          </span>
                          <span className="font-bold text-emerald-ink">{app.matchScore}%</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-champagne-border/40 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-emerald to-gold-accent transition-all duration-500"
                            style={{ width: `${Math.min(100, Math.max(5, app.matchScore))}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Actions & Withdraw */}
                    <div className="flex flex-row lg:flex-col items-end justify-between gap-3 shrink-0">
                      {canWithdraw && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedAppToWithdraw(app)}
                          className="text-error-red hover:bg-error-bg hover:text-error-red text-xs"
                        >
                          Withdraw Application
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Recruiter Note Callout if provided */}
                  {app.recruiterNote && (
                    <div className="mt-4 p-3 rounded-xl bg-gold-badge/60 border border-gold-accent/30 text-xs text-body-text">
                      <div className="flex items-center gap-1.5 font-semibold text-emerald-ink mb-1">
                        <MessageSquare className="w-3.5 h-3.5 text-gold-accent" />
                        Note from Recruiter:
                      </div>
                      <p className="leading-relaxed">{app.recruiterNote}</p>
                    </div>
                  )}

                  {/* Cover Note Dropdown */}
                  {app.coverNote && (
                    <div className="mt-4 pt-3 border-t border-champagne-border/50">
                      <button
                        onClick={() => toggleExpand(app._id)}
                        className="flex items-center gap-1 text-xs font-medium text-emerald-ink/80 hover:text-emerald-ink transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>{isExpanded ? "Hide Cover Note" : "View Cover Note"}</span>
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>
                      {isExpanded && (
                        <div className="mt-2 p-3 rounded-xl bg-champagne/30 text-xs text-body-text/80 whitespace-pre-line leading-relaxed">
                          {app.coverNote}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Status Timeline */}
                  {app.statusHistory && app.statusHistory.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-champagne-border/50">
                      <h4 className="text-[11px] font-semibold text-body-text/60 uppercase tracking-wider mb-2">
                        Status Timeline
                      </h4>
                      <div className="flex flex-wrap items-center gap-2">
                        {app.statusHistory.map((historyItem, idx) => (
                          <React.Fragment key={idx}>
                            <div className="flex items-center gap-1.5 text-xs bg-cream px-2.5 py-1 rounded-lg border border-champagne-border">
                              <span className="capitalize font-medium text-emerald-ink">
                                {historyItem.status}
                              </span>
                              <span className="text-[10px] text-body-text/50">
                                {new Date(historyItem.at).toLocaleDateString("en-IN", {
                                  day: "numeric",
                                  month: "short",
                                })}
                              </span>
                            </div>
                            {idx < app.statusHistory.length - 1 && (
                              <span className="text-body-text/30 text-xs">→</span>
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}

            {/* Pagination */}
            {data.totalPages > 1 && (
              <div className="pt-4 flex justify-center">
                <Pagination
                  currentPage={data.page}
                  totalPages={data.totalPages}
                  onPageChange={(p) => setPage(p)}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Withdraw Confirmation Modal */}
      <Modal
        isOpen={Boolean(selectedAppToWithdraw)}
        onClose={() => setSelectedAppToWithdraw(null)}
        title="Withdraw Application"
        description="Are you sure you want to withdraw your application?"
      >
        <div className="space-y-4">
          <div className="p-3 bg-error-bg/60 rounded-xl border border-error-red/20 flex items-start gap-3 text-xs text-body-text">
            <AlertTriangle className="w-5 h-5 text-error-red shrink-0 mt-0.5" />
            <p>
              Withdrawing your application for{" "}
              <strong>
                {typeof selectedAppToWithdraw?.job === "object"
                  ? selectedAppToWithdraw?.job?.title
                  : "this role"}
              </strong>{" "}
              cannot be undone. The hiring team will be notified that you are no longer considering this position.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-champagne-border/60">
            <Button
              type="button"
              variant="outline"
              onClick={() => setSelectedAppToWithdraw(null)}
              disabled={withdrawMutation.isPending}
            >
              Keep Application
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={handleWithdrawConfirm}
              isLoading={withdrawMutation.isPending}
            >
              Yes, Withdraw
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
