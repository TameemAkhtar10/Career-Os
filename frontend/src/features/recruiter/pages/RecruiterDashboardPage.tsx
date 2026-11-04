"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMyJobs, useUpdateJobStatus, useDeleteJob } from "../../jobs/hooks/useJobs";
import { Job } from "../../../types/job";
import { formatSalary } from "../../jobs/utils";
import { Card } from "../../../components/ui/Card";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { Tabs, TabItem } from "../../../components/ui/Tabs";
import { Modal } from "../../../components/ui/Modal";
import { Skeleton } from "../../../components/ui/Skeleton";
import { Pagination } from "../../../components/ui/Pagination";
import { EmptyState } from "../../../components/feedback/EmptyState";
import { CompanyProfileWarningBanner } from "../components/CompanyProfileWarningBanner";
import {
  Briefcase,
  Users,
  Plus,
  Eye,
  Edit3,
  XCircle,
  Clock,
  Sparkles,
  MapPin,
  IndianRupee,
  AlertTriangle,
  FolderOpen,
  CheckCircle2,
} from "lucide-react";

type JobStatusFilter = "all" | "open" | "draft" | "closed";

export const RecruiterDashboardPage: React.FC = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<JobStatusFilter>("all");
  const [page, setPage] = useState(1);
  const [selectedJobToClose, setSelectedJobToClose] = useState<Job | null>(null);

  // Fetch jobs for the active filter
  const { data, isLoading, isError } = useMyJobs({
    status: activeTab === "all" ? undefined : activeTab,
    page,
    limit: 10,
  });

  // Also fetch all jobs to calculate counts across statuses
  const { data: allJobsData } = useMyJobs({ limit: 50 });

  const updateStatusMutation = useUpdateJobStatus();
  const deleteJobMutation = useDeleteJob();

  const allJobs = allJobsData?.jobs || [];
  const totalCount = allJobsData?.total ?? allJobs.length;
  const openCount = allJobs.filter((j) => j.status === "open").length;
  const draftCount = allJobs.filter((j) => j.status === "draft").length;
  const closedCount = allJobs.filter((j) => j.status === "closed").length;

  const tabs: TabItem<JobStatusFilter>[] = [
    { id: "all", label: "All Jobs", count: totalCount },
    { id: "open", label: "Open", count: openCount },
    { id: "draft", label: "Drafts", count: draftCount },
    { id: "closed", label: "Closed", count: closedCount },
  ];

  const handleCloseConfirm = async () => {
    if (!selectedJobToClose) return;
    try {
      await deleteJobMutation.mutateAsync(selectedJobToClose._id);
      setSelectedJobToClose(null);
    } catch {
      // toast is already fired inside hook
    }
  };

  const handleTogglePublish = async (job: Job) => {
    const nextStatus = job.status === "open" ? "draft" : "open";
    await updateStatusMutation.mutateAsync({
      id: job._id,
      status: nextStatus,
    });
  };

  return (
    <>
      <CompanyProfileWarningBanner />
      <div className="min-h-screen bg-champagne/40 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="font-heading text-2xl sm:text-3xl font-bold text-emerald-ink">
                Recruiter Dashboard
              </h1>
              <p className="text-sm text-body-text/70 mt-1">
                Manage your job postings, track applicant pipelines, and evaluate candidates.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/recruiter/company">
                <Button variant="outline" size="sm">
                  Company Profile
                </Button>
              </Link>
              <Link href="/recruiter/jobs/new">
                <Button variant="primary" size="sm" className="gap-1.5 shadow-md">
                  <Plus className="w-4 h-4" />
                  Post a Job
                </Button>
              </Link>
            </div>
          </div>

          {/* Metric Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card className="p-4 sm:p-5 bg-cream border-champagne-border">
              <div className="flex items-center justify-between text-xs text-body-text/60 mb-2">
                <span className="font-medium uppercase tracking-wider">Total Postings</span>
                <Briefcase className="w-4 h-4 text-emerald-ink" />
              </div>
              <p className="font-heading text-2xl sm:text-3xl font-bold text-emerald-ink">
                {totalCount}
              </p>
            </Card>

            <Card className="p-4 sm:p-5 bg-cream border-champagne-border">
              <div className="flex items-center justify-between text-xs text-emerald-ink font-medium uppercase tracking-wider mb-2">
                <span>Active Open</span>
                <span className="w-2 h-2 rounded-full bg-emerald animate-pulse" />
              </div>
              <p className="font-heading text-2xl sm:text-3xl font-bold text-emerald">
                {openCount}
              </p>
            </Card>

            <Card className="p-4 sm:p-5 bg-cream border-champagne-border">
              <div className="flex items-center justify-between text-xs text-gold-accent font-medium uppercase tracking-wider mb-2">
                <span>Drafts</span>
                <Clock className="w-4 h-4 text-gold-accent" />
              </div>
              <p className="font-heading text-2xl sm:text-3xl font-bold text-gold-accent">
                {draftCount}
              </p>
            </Card>

            <Card className="p-4 sm:p-5 bg-cream border-champagne-border">
              <div className="flex items-center justify-between text-xs text-body-text/60 font-medium uppercase tracking-wider mb-2">
                <span>Closed</span>
                <XCircle className="w-4 h-4 text-body-text/50" />
              </div>
              <p className="font-heading text-2xl sm:text-3xl font-bold text-body-text/70">
                {closedCount}
              </p>
            </Card>
          </div>

          {/* Status Tabs */}
          <div className="bg-cream/60 p-2 rounded-2xl border border-champagne-border/80">
            <Tabs
              tabs={tabs}
              activeTab={activeTab}
              onChange={(t) => {
                setActiveTab(t);
                setPage(1);
              }}
            />
          </div>

          {/* Jobs List Section */}
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
              <p className="text-sm text-error-red">Failed to load jobs. Please try refreshing.</p>
            </Card>
          ) : !data || data.jobs.length === 0 ? (
            <EmptyState
              title="No jobs found"
              description={
                activeTab === "all"
                  ? "You have not published or drafted any job openings yet. Click 'Post a Job' to begin hiring."
                  : `You have no job listings with status "${activeTab}".`
              }
              actionLabel="Post a Job"
              onAction={() => router.push("/recruiter/jobs/new")}
            />
          ) : (
            <div className="space-y-4">
              {data.jobs.map((job) => {
                const salaryStr = formatSalary(job.salary);
                const locStr = [job.location?.city, job.location?.state].filter(Boolean).join(", ") || "Remote";

                return (
                  <Card
                    key={job._id}
                    className="p-6 bg-cream border-champagne-border hover:shadow-soft-emerald transition-all"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      {/* Job Info */}
                      <div className="space-y-2 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {job.status === "open" && <Badge variant="success">Open</Badge>}
                          {job.status === "draft" && <Badge variant="gold">Draft</Badge>}
                          {job.status === "closed" && <Badge variant="outline">Closed</Badge>}

                          {job.isFresherFriendly && (
                            <Badge variant="fresher" className="gap-1">
                              <Sparkles className="w-3 h-3" />
                              Fresher Friendly
                            </Badge>
                          )}

                          <span className="text-xs px-2.5 py-0.5 rounded-full bg-champagne text-body-text capitalize">
                            {job.workMode}
                          </span>
                          <span className="text-xs px-2.5 py-0.5 rounded-full bg-champagne text-body-text capitalize">
                            {job.jobType?.replace("_", " ")}
                          </span>
                        </div>

                        <div>
                          <Link
                            href={`/jobs/${job._id}`}
                            className="font-heading text-lg sm:text-xl font-bold text-emerald-ink hover:text-emerald-hover transition-colors"
                          >
                            {job.title}
                          </Link>
                          <div className="flex flex-wrap items-center gap-4 text-xs text-body-text/70 mt-1">
                            <span className="flex items-center gap-1 font-medium">
                              <IndianRupee className="w-3.5 h-3.5 text-gold-accent" />
                              {salaryStr}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-gold-accent" />
                              {locStr}
                            </span>
                            <span className="flex items-center gap-1">
                              <Briefcase className="w-3.5 h-3.5 text-gold-accent" />
                              {job.experience?.minYears === 0
                                ? "Freshers"
                                : `${job.experience?.minYears} - ${job.experience?.maxYears} yrs`}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="w-3.5 h-3.5 text-gold-accent" />
                              {job.openings} opening{job.openings > 1 ? "s" : ""}
                            </span>
                            <span className="text-body-text/50">
                              Posted {new Date(job.createdAt).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Recruiter Actions */}
                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <Link href={`/recruiter/jobs/${job._id}/applicants`}>
                          <Button variant="primary" size="sm" className="gap-1.5 shadow-sm">
                            <Users className="w-3.5 h-3.5" />
                            Applicants
                          </Button>
                        </Link>

                        <Link href={`/recruiter/jobs/${job._id}/edit`}>
                          <Button variant="secondary" size="sm" className="gap-1.5">
                            <Edit3 className="w-3.5 h-3.5" />
                            Edit
                          </Button>
                        </Link>

                        {job.status !== "closed" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleTogglePublish(job)}
                            className="text-xs"
                          >
                            {job.status === "open" ? "Set to Draft" : "Publish"}
                          </Button>
                        )}

                        {job.status !== "closed" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedJobToClose(job)}
                            className="text-error-red hover:bg-error-bg text-xs"
                          >
                            Close Job
                          </Button>
                        )}
                      </div>
                    </div>
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
      </div>

      {/* Close Job Confirmation Modal */}
      <Modal
        isOpen={Boolean(selectedJobToClose)}
        onClose={() => setSelectedJobToClose(null)}
        title="Close Job Listing"
        description="Are you sure you want to close this job?"
      >
        <div className="space-y-4">
          <div className="p-3 bg-error-bg/60 rounded-xl border border-error-red/20 flex items-start gap-3 text-xs text-body-text">
            <AlertTriangle className="w-5 h-5 text-error-red shrink-0 mt-0.5" />
            <p>
              Closing <strong>{selectedJobToClose?.title}</strong> will immediately stop accepting new candidate applications and mark the position as closed.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-champagne-border/60">
            <Button
              type="button"
              variant="outline"
              onClick={() => setSelectedJobToClose(null)}
              disabled={deleteJobMutation.isPending}
            >
              Keep Open
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={handleCloseConfirm}
              isLoading={deleteJobMutation.isPending}
            >
              Close Job
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

