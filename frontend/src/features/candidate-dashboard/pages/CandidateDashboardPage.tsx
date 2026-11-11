"use client";

import React from "react";
import Link from "next/link";
import { useCandidateDashboard } from "../hooks/useCandidateDashboard";
import { Card } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { Badge } from "../../../components/ui/Badge";
import { ROUTES } from "../../../constants/routes";
import { WORK_MODE_LABELS, JOB_TYPE_LABELS } from "../../../constants/enums";
import { formatSalary } from "../../jobs/utils";
import {
  UserCheck,
  FileText,
  Sparkles,
  Briefcase,
  ArrowRight,
  TrendingUp,
  Lightbulb,
  CheckCircle2,
  Clock,
  MapPin,
  ExternalLink,
  ChevronRight,
  Upload,
} from "lucide-react";

export const CandidateDashboardPage: React.FC = () => {
  const { data: dashboard, isLoading, error } = useCandidateDashboard();

  if (isLoading) {
    return (
      <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6 animate-pulse">
        <div className="h-10 bg-champagne/60 rounded-ui w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-44 bg-cream rounded-card border border-border" />
          <div className="h-44 bg-cream rounded-card border border-border" />
          <div className="h-44 bg-cream rounded-card border border-border" />
        </div>
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-error-bg text-error flex items-center justify-center mx-auto">
          <Briefcase className="w-6 h-6" />
        </div>
        <h2 className="font-display text-2xl font-bold text-emerald-dark">
          Unable to Load Candidate Dashboard
        </h2>
        <p className="text-xs text-muted max-w-sm mx-auto">
          Could not retrieve your dashboard summary right now. Please check your network and refresh.
        </p>
        <Button variant="primary" size="sm" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  const {
    profileCompleteness,
    hasResume,
    latestResumeScore,
    applicationsByStatus,
    recentApplications,
    recommendedJobs,
    tips,
  } = dashboard;

  // Circular ring calculations for Profile Completeness
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const completenessOffset =
    circumference - (profileCompleteness / 100) * circumference;

  return (
    <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      {/* ── Welcome Header ──────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald/10 text-emerald text-xs font-semibold mb-1.5">
            <UserCheck className="w-3.5 h-3.5 text-gold" />
            <span>Candidate Overview</span>
          </div>
          <h1 className="font-display text-2xl sm:text-4xl font-bold text-emerald-dark">
            Candidate Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-1">
            Track your profile completeness, resume score, applications, and recommended openings.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href={ROUTES.CANDIDATE.RESUME_CHECK}>
            <Button variant="outline" size="sm" className="gap-1.5 bg-cream hover:bg-champagne/60 text-xs">
              <Sparkles className="w-3.5 h-3.5 text-gold" />
              <span>Resume Score</span>
            </Button>
          </Link>
          <Link href={ROUTES.JOBS}>
            <Button variant="primary" size="sm" className="gap-1.5 text-xs shadow-emerald-sm">
              <span>Browse Jobs</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* ── Top Highlight Cards Grid ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Card 1: Profile Completeness */}
        <Card className="p-6 bg-cream border-border shadow-emerald-sm flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted uppercase tracking-wider">
              Profile Readiness
            </span>
            <span className="text-xs font-bold text-emerald-dark tabular-nums">
              {profileCompleteness}%
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Circular Mini Progress Ring */}
            <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
              <svg width={80} height={80} className="rotate-[-90deg]">
                <circle
                  cx={40}
                  cy={40}
                  r={radius}
                  stroke="#E8D3AA"
                  strokeWidth={7}
                  fill="transparent"
                  opacity={0.4}
                />
                <circle
                  cx={40}
                  cy={40}
                  r={radius}
                  stroke="#064E3B"
                  strokeWidth={7}
                  strokeDasharray={circumference}
                  strokeDashoffset={completenessOffset}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-700 ease-out"
                />
              </svg>
              <span className="absolute font-display font-bold text-base text-emerald-dark tabular-nums">
                {profileCompleteness}%
              </span>
            </div>

            <div className="min-w-0">
              <h3 className="font-display text-base font-bold text-emerald-dark truncate">
                Profile Completeness
              </h3>
              <p className="text-xs text-body/75 mt-0.5 leading-relaxed">
                {profileCompleteness >= 100
                  ? "Your profile is 100% complete and fully verified."
                  : "Complete your profile to maximize recruiter visibility."}
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-border/60">
            <Link href={ROUTES.CANDIDATE.PROFILE}>
              <Button variant="outline" size="sm" className="w-full text-xs justify-between">
                <span>{profileCompleteness >= 100 ? "Review Profile" : "Complete Profile"}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </Card>

        {/* Card 2: Resume Score Checker */}
        <Card className="p-6 bg-cream border-border shadow-emerald-sm flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted uppercase tracking-wider">
              Resume Assessment
            </span>
            <span className="text-[10px] text-muted">Self-Check</span>
          </div>

          {latestResumeScore ? (
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald/10 border border-emerald/20 flex flex-col items-center justify-center shrink-0">
                <span className="font-display text-2xl font-bold text-emerald-dark tabular-nums">
                  {latestResumeScore.score}
                </span>
                <span className="text-[10px] font-bold text-gold uppercase tracking-wider">
                  Grade {latestResumeScore.grade}
                </span>
              </div>

              <div className="min-w-0">
                <h3 className="font-display text-base font-bold text-emerald-dark truncate">
                  Latest Resume Score
                </h3>
                <p className="text-xs text-muted mt-0.5">
                  Scanned {new Date(latestResumeScore.date).toLocaleDateString("en-IN", {
                    month: "short",
                    day: "numeric",
                  })}
                </p>
                <p className="text-[11px] text-body/70 truncate max-w-xs">
                  File: {latestResumeScore.fileName}
                </p>
              </div>
            </div>
          ) : hasResume ? (
            <div className="space-y-1">
              <h3 className="font-display text-base font-bold text-emerald-dark">
                Resume Uploaded
              </h3>
              <p className="text-xs text-body/75 leading-relaxed">
                You have uploaded a PDF resume, but haven&apos;t run a Resume Score check yet.
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              <h3 className="font-display text-base font-bold text-emerald-dark">
                No Resume Uploaded
              </h3>
              <p className="text-xs text-body/75 leading-relaxed">
                Upload your resume in PDF format to receive instant formatting insights.
              </p>
            </div>
          )}

          <div className="pt-2 border-t border-border/60">
            <Link href={hasResume ? ROUTES.CANDIDATE.RESUME_CHECK : ROUTES.CANDIDATE.PROFILE}>
              <Button variant="primary" size="sm" className="w-full text-xs justify-between shadow-emerald-sm">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-gold-light" />
                  <span>{latestResumeScore ? "View Full Report" : hasResume ? "Check Resume Score" : "Upload Resume"}</span>
                </span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </Card>

        {/* Card 3: Applications Status Overview */}
        <Card className="p-6 bg-cream border-border shadow-emerald-sm flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted uppercase tracking-wider">
              Application Tracker
            </span>
            <Link
              href={ROUTES.CANDIDATE.APPLICATIONS}
              className="text-xs text-gold hover:text-emerald-dark font-semibold"
            >
              View All
            </Link>
          </div>

          <div className="grid grid-cols-4 gap-2 text-center py-1">
            <div className="p-2 rounded-ui bg-champagne/40 border border-border/70">
              <span className="font-display text-lg font-bold text-emerald-dark tabular-nums block">
                {applicationsByStatus.applied}
              </span>
              <span className="text-[10px] text-muted">Applied</span>
            </div>

            <div className="p-2 rounded-ui bg-success-bg/40 border border-success-border">
              <span className="font-display text-lg font-bold text-success tabular-nums block">
                {applicationsByStatus.shortlisted}
              </span>
              <span className="text-[10px] text-muted">Shortlist</span>
            </div>

            <div className="p-2 rounded-ui bg-champagne/40 border border-border/70">
              <span className="font-display text-lg font-bold text-emerald tabular-nums block">
                {applicationsByStatus.hired}
              </span>
              <span className="text-[10px] text-muted">Hired</span>
            </div>

            <div className="p-2 rounded-ui bg-error-bg/40 border border-error-border">
              <span className="font-display text-lg font-bold text-error tabular-nums block">
                {applicationsByStatus.rejected}
              </span>
              <span className="text-[10px] text-muted">Rejected</span>
            </div>
          </div>

          <div className="pt-2 border-t border-border/60">
            <Link href={ROUTES.CANDIDATE.APPLICATIONS}>
              <Button variant="outline" size="sm" className="w-full text-xs justify-between">
                <span>Manage Submitted Applications</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </Card>
      </div>

      {/* ── Actionable Career Tips Banner ─────────────────────────────────── */}
      {tips && tips.length > 0 && (
        <Card className="p-5 sm:p-6 bg-gradient-to-r from-cream via-champagne/30 to-cream border border-gold/40 shadow-emerald-sm space-y-3">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-gold shrink-0" />
            <h3 className="font-display text-base font-bold text-emerald-dark">
              Personalized Recommendations for You
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {tips.map((tip, idx) => (
              <div
                key={idx}
                className="p-3 rounded-ui bg-white/80 border border-border/60 text-xs text-body/90 leading-relaxed flex items-start gap-2 shadow-sm"
              >
                <span className="text-gold font-bold">★</span>
                <span>{tip}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ── Two Column: Recent Applications & Recommended Jobs ─────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Recent Applications (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald shrink-0" />
              <h2 className="font-display text-lg font-bold text-emerald-dark">
                Recent Applications
              </h2>
            </div>
            <Link
              href={ROUTES.CANDIDATE.APPLICATIONS}
              className="text-xs text-gold hover:text-emerald-dark font-semibold"
            >
              View All ({recentApplications.length})
            </Link>
          </div>

          {recentApplications.length === 0 ? (
            <Card className="p-8 bg-cream border-border text-center space-y-3">
              <Briefcase className="w-8 h-8 text-muted mx-auto" />
              <p className="text-xs font-semibold text-emerald-dark">No Applications Submitted</p>
              <p className="text-[11px] text-muted">
                Explore verified fresher roles and submit your first application.
              </p>
              <Link href={ROUTES.JOBS}>
                <Button variant="primary" size="sm" className="text-xs mt-2">
                  Find Jobs
                </Button>
              </Link>
            </Card>
          ) : (
            <div className="space-y-3">
              {recentApplications.map((app) => {
                let statusBadge = <Badge variant="outline">{app.status}</Badge>;
                if (app.status === "shortlisted") statusBadge = <Badge variant="success">Shortlisted</Badge>;
                if (app.status === "rejected") statusBadge = <Badge variant="error">Rejected</Badge>;
                if (app.status === "hired") statusBadge = <Badge variant="fresher">Hired</Badge>;

                return (
                  <Card
                    key={app._id}
                    className="p-4 bg-cream border-border/80 shadow-emerald-sm space-y-2 hover:border-gold/50 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h4 className="font-display text-sm font-bold text-emerald-dark truncate">
                          {app.jobTitle}
                        </h4>
                        <p className="text-xs text-muted truncate">{app.companyName}</p>
                      </div>
                      {statusBadge}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-body/70 pt-2 border-t border-border/50">
                      <span>
                        Applied {new Date(app.appliedAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                      {app.matchScore > 0 && (
                        <span className="font-semibold text-emerald-dark">
                          Match: {app.matchScore}%
                        </span>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Recommended Jobs by Skills (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-gold shrink-0" />
              <h2 className="font-display text-lg font-bold text-emerald-dark">
                Recommended for Your Skills
              </h2>
            </div>
            <Link
              href={ROUTES.JOBS}
              className="text-xs text-gold hover:text-emerald-dark font-semibold"
            >
              Browse All
            </Link>
          </div>

          {recommendedJobs.length === 0 ? (
            <Card className="p-8 bg-cream border-border text-center space-y-3">
              <Sparkles className="w-8 h-8 text-muted mx-auto" />
              <p className="text-xs font-semibold text-emerald-dark">No New Open Positions</p>
              <p className="text-[11px] text-muted">
                Add more technical skills to your profile to get personalized recommendations.
              </p>
              <Link href={ROUTES.CANDIDATE.PROFILE}>
                <Button variant="outline" size="sm" className="text-xs mt-2">
                  Update Skills
                </Button>
              </Link>
            </Card>
          ) : (
            <div className="space-y-3">
              {recommendedJobs.map((job) => {
                const workModeLabel =
                  WORK_MODE_LABELS[job.workMode] || job.workMode;
                const jobTypeLabel =
                  JOB_TYPE_LABELS[job.jobType] || job.jobType;

                return (
                  <Card
                    key={job._id}
                    className="p-4 sm:p-5 bg-cream border-border shadow-emerald-sm space-y-3 hover:border-gold/60 transition-all flex flex-col justify-between"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link
                            href={ROUTES.JOB_DETAIL(job._id)}
                            className="font-display text-base font-bold text-emerald-dark hover:text-gold transition-colors truncate"
                          >
                            {job.title}
                          </Link>
                          {job.isFresherFriendly && (
                            <Badge variant="fresher" size="sm">
                              Fresher
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted font-medium mt-0.5">
                          {job.companyName} · {job.location?.city || "Remote"}
                        </p>
                      </div>

                      {/* Match Score Badge */}
                      {job.matchScore > 0 && (
                        <div className="self-start sm:self-center px-2.5 py-1 rounded-full bg-emerald/10 border border-emerald/20 text-xs font-bold text-emerald-dark shrink-0">
                          {job.matchScore}% skill match
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-body/75 flex-wrap">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-emerald" />
                        {workModeLabel}
                      </span>
                      <span>·</span>
                      <span>{jobTypeLabel}</span>
                      {job.salary?.isVisible && (
                        <>
                          <span>·</span>
                          <span className="font-semibold text-emerald-dark">
                            {formatSalary(job.salary)}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Skill tags */}
                    {job.skills && job.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {job.skills.slice(0, 4).map((skill, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] bg-white border border-border/60 text-body/80 px-2 py-0.5 rounded-full"
                          >
                            {skill}
                          </span>
                        ))}
                        {job.skills.length > 4 && (
                          <span className="text-[10px] text-muted self-center">
                            +{job.skills.length - 4} more
                          </span>
                        )}
                      </div>
                    )}

                    <div className="pt-2 border-t border-border/50 flex justify-end">
                      <Link href={ROUTES.JOB_DETAIL(job._id)}>
                        <Button variant="outline" size="sm" className="text-xs gap-1.5">
                          <span>View &amp; Apply</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Button>
                      </Link>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

