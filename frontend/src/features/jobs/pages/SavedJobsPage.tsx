"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useSavedJobsList, useToggleSaveJob } from "../hooks/useSavedJobs";
import { formatSalary } from "../utils";
import { Card } from "../../../components/ui/Card";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { EmptyState } from "../../../components/feedback/EmptyState";
import { Pagination } from "../../../components/ui/Pagination";
import { BrandLoader } from "../../../components/feedback/BrandLoader";
import { ROUTES } from "../../../constants/routes";
import {
  Bookmark,
  Trash2,
  MapPin,
  Briefcase,
  Sparkles,
  ArrowRight,
  AlertCircle,
  ExternalLink,
} from "lucide-react";

export const SavedJobsPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useSavedJobsList(page, 10);
  const toggleSave = useToggleSaveJob();

  if (isLoading) {
    return <BrandLoader message="Loading your saved jobs..." />;
  }

  const items = data?.savedJobs || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  return (
    <div className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      {/* Page Header */}
      <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/60 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-badge bg-champagne border border-border text-emerald text-xs font-semibold mb-2">
            <Bookmark className="w-3.5 h-3.5 text-gold fill-gold" />
            <span>Candidate Bookmarks</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-emerald-dark tracking-tight">
            Saved Jobs
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-1">
            Review your shortlisted roles, track application status, and manage bookmarks.
          </p>
        </div>

        {total > 0 && (
          <div className="px-3.5 py-1.5 rounded-ui bg-cream border border-border text-xs font-semibold text-emerald-dark">
            {total} {total === 1 ? "job" : "jobs"} saved (max 100)
          </div>
        )}
      </div>

      {/* Content */}
      {items.length === 0 ? (
        <EmptyState
          title="No saved jobs yet"
          message="Bookmark opportunities while browsing to compare packages, review required skills, and apply when ready."
          actionText="Explore Open Jobs"
          actionHref={ROUTES.JOBS}
        />
      ) : (
        <div className="space-y-4">
          {items.map((item) => {
            const job = item.job;
            const isClosed = item.isClosed;

            return (
              <Card
                key={item._id}
                className="p-5 sm:p-6 bg-cream border-border/80 shadow-emerald-sm transition-all hover:border-gold/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5"
              >
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {isClosed ? (
                      <Badge variant="error" size="sm" className="gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {item.isDeleted ? "Job Removed" : "Closed / Expired"}
                      </Badge>
                    ) : (
                      <Badge variant="fresher" size="sm">
                        Open
                      </Badge>
                    )}

                    {job?.isFresherFriendly && !isClosed && (
                      <Badge variant="outline" size="sm" className="gap-1 text-gold-dark border-gold/40">
                        <Sparkles className="w-3 h-3 text-gold" />
                        Fresher friendly
                      </Badge>
                    )}

                    {job?.jobType && (
                      <span className="text-[11px] text-muted capitalize">
                        {job.jobType.replace("_", " ")}
                      </span>
                    )}
                  </div>

                  <h2 className="font-display text-lg sm:text-xl font-bold text-emerald-dark truncate">
                    {job?.title || "Archived Job Role"}
                  </h2>

                  <p className="text-xs font-semibold text-muted uppercase tracking-wider">
                    {job?.companyName || "Organization"}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-body/80 pt-1">
                    {job?.location?.city && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-emerald" />
                        {job.location.city}
                      </span>
                    )}

                    {job?.workMode && (
                      <span className="inline-flex items-center gap-1 capitalize">
                        <Briefcase className="w-3.5 h-3.5 text-emerald" />
                        {job.workMode}
                      </span>
                    )}

                    {job?.salary && (
                      <span className="font-semibold text-emerald-dark">
                        💰 {formatSalary(job.salary)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-border/60">
                  <button
                    type="button"
                    onClick={() =>
                      job?._id &&
                      toggleSave.mutate({ jobId: job._id, isSaved: true })
                    }
                    disabled={toggleSave.isPending}
                    aria-label="Remove from saved jobs"
                    className="p-2 rounded-ui text-muted hover:text-error hover:bg-error-bg/60 border border-transparent hover:border-error-border transition-colors text-xs font-medium inline-flex items-center gap-1.5"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="sm:hidden text-xs">Remove</span>
                  </button>

                  {job && !isClosed ? (
                    <Link href={ROUTES.JOB_DETAIL(job._id)} className="flex-1 sm:flex-initial">
                      <Button size="sm" variant="primary" className="w-full gap-1.5">
                        <span>View Role</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                  ) : (
                    <Link href={ROUTES.JOBS} className="flex-1 sm:flex-initial">
                      <Button size="sm" variant="outline" className="w-full">
                        Find similar
                      </Button>
                    </Link>
                  )}
                </div>
              </Card>
            );
          })}

          {totalPages > 1 && (
            <div className="pt-6">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={(p) => setPage(p)}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
