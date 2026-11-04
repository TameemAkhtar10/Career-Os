"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useJobDetail } from "../../jobs/hooks/useJobs";
import {
  useJobApplications,
  useUpdateApplicationStatus,
} from "../hooks/useApplications";
import { useCandidateProfile } from "../../profile/hooks/useProfile";
import { Application, CandidateApplicantSummary } from "../../../types/application";
import { Card } from "../../../components/ui/Card";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { Tabs, TabItem } from "../../../components/ui/Tabs";
import { Modal } from "../../../components/ui/Modal";
import { Skeleton } from "../../../components/ui/Skeleton";
import { Pagination } from "../../../components/ui/Pagination";
import { EmptyState } from "../../../components/feedback/EmptyState";
import { ErrorState } from "../../../components/feedback/ErrorState";
import { BrandLoader } from "../../../components/feedback/BrandLoader";
import { toast } from "sonner";
import {
  ArrowLeft,
  Users,
  Sparkles,
  CheckCircle,
  XCircle,
  UserCheck,
  FileText,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  X,
  GraduationCap,
  Briefcase,
  FolderGit2,
  Globe,
  MapPin,
  Clock,
} from "lucide-react";

export interface JobApplicantsPageProps {
  jobId: string;
}

type ApplicantStatusFilter = "all" | "applied" | "shortlisted" | "hired" | "rejected" | "withdrawn";

export const JobApplicantsPage: React.FC<JobApplicantsPageProps> = ({ jobId }) => {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<ApplicantStatusFilter>("all");
  const [minScore, setMinScore] = useState<number | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({});

  // Action modal state
  const [actionTarget, setActionTarget] = useState<{
    app: Application;
    status: "shortlisted" | "rejected" | "hired";
  } | null>(null);
  const [recruiterNote, setRecruiterNote] = useState("");

  // Candidate Profile Drawer state
  const [drawerUserId, setDrawerUserId] = useState<string | null>(null);

  const { data: job, isLoading: isJobLoading, error: jobError } = useJobDetail(jobId);

  const {
    data: appsData,
    isLoading: isAppsLoading,
    error: appsError,
  } = useJobApplications(jobId, {
    status: activeTab === "all" ? undefined : activeTab,
    minScore,
    page,
    limit: 10,
  });

  const updateStatusMutation = useUpdateApplicationStatus(jobId);

  // Drawer profile fetch
  const { data: drawerProfile, isLoading: isDrawerLoading } = useCandidateProfile(
    drawerUserId || ""
  );

  const tabs: TabItem<ApplicantStatusFilter>[] = [
    { id: "all", label: "All Applicants" },
    { id: "applied", label: "Pending" },
    { id: "shortlisted", label: "Shortlisted" },
    { id: "hired", label: "Hired" },
    { id: "rejected", label: "Not Selected" },
    { id: "withdrawn", label: "Withdrawn" },
  ];

  // Check 403 or 404 permissions
  const errStatus = (jobError as any)?.response?.status || (appsError as any)?.response?.status;
  if (errStatus === 403) {
    return (
      <div className="min-h-screen bg-champagne/40 py-16 px-4">
        <div className="max-w-xl mx-auto">
          <ErrorState
            title="Access Restricted"
            message="You do not have permission to view applicants for this job opening."
            onRetry={() => router.push("/recruiter/dashboard")}
          />
        </div>
      </div>
    );
  }

  if (errStatus === 404) {
    return (
      <div className="min-h-screen bg-champagne/40 py-16 px-4">
        <div className="max-w-xl mx-auto">
          <ErrorState
            title="Job Not Found"
            message="The requested job listing could not be found."
            onRetry={() => router.push("/recruiter/dashboard")}
          />
        </div>
      </div>
    );
  }

  if (isJobLoading) {
    return <BrandLoader message="Loading job applicants..." />;
  }

  const handleOpenActionModal = (app: Application, status: "shortlisted" | "rejected" | "hired") => {
    setActionTarget({ app, status });
    setRecruiterNote(app.recruiterNote || "");
  };

  const handleConfirmAction = async () => {
    if (!actionTarget) return;

    try {
      await updateStatusMutation.mutateAsync({
        id: actionTarget.app._id,
        status: actionTarget.status,
        recruiterNote: recruiterNote.trim() || undefined,
      });
      setActionTarget(null);
      setRecruiterNote("");
    } catch {
      // toast handled in hook
    }
  };

  const toggleExpand = (appId: string) => {
    setExpandedNotes((prev) => ({ ...prev, [appId]: !prev[appId] }));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "applied":
        return <Badge variant="outline">Pending Review</Badge>;
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

  const jobSkillsSet = new Set((job?.skills || []).map((s) => s.toLowerCase()));

  return (
    <div className="min-h-screen bg-champagne/40 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-3">
          <Link
            href="/recruiter/dashboard"
            className="inline-flex items-center gap-2 text-sm font-medium text-emerald-ink/80 hover:text-emerald-ink transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-body-text/70 mb-1">
                <span>{job?.companyName}</span>
                <span>•</span>
                <span className="capitalize">{job?.workMode}</span>
              </div>
              <h1 className="font-heading text-2xl sm:text-3xl font-bold text-emerald-ink">
                Applicants: {job?.title}
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <Link href={`/jobs/${jobId}`}>
                <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                  <ExternalLink className="w-3.5 h-3.5" />
                  View Public Post
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Filters Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-cream/70 p-3 rounded-2xl border border-champagne-border">
          <Tabs
            tabs={tabs}
            activeTab={activeTab}
            onChange={(t) => {
              setActiveTab(t);
              setPage(1);
            }}
          />

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-semibold text-emerald-ink">Min Match:</span>
            <select
              value={minScore != null ? String(minScore) : ""}
              onChange={(e) => {
                setMinScore(e.target.value ? Number(e.target.value) : undefined);
                setPage(1);
              }}
              className="text-xs px-2.5 py-1.5 rounded-lg bg-cream border border-champagne-border text-body-text focus:outline-none focus:ring-2 focus:ring-gold-accent"
            >
              <option value="">All Scores</option>
              <option value="50">50% and above</option>
              <option value="70">70% and above</option>
              <option value="85">85% and above</option>
            </select>
          </div>
        </div>

        {/* Applicants List */}
        {isAppsLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-6 bg-cream border-champagne-border">
                <div className="space-y-3">
                  <Skeleton className="h-6 w-1/4" />
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-12 w-full" />
                </div>
              </Card>
            ))}
          </div>
        ) : !appsData || appsData.applications.length === 0 ? (
          <EmptyState
            title="No applicants found"
            description={
              activeTab === "all"
                ? "No candidates have applied to this position yet."
                : `No candidates found with status "${activeTab}".`
            }
          />
        ) : (
          <div className="space-y-4">
            {appsData.applications.map((app) => {
              const cand = app.candidate as CandidateApplicantSummary | undefined;
              const candId = cand?._id || (typeof app.candidate === "string" ? app.candidate : "");
              const isWithdrawn = app.status === "withdrawn";
              const isExpanded = expandedNotes[app._id];

              return (
                <Card
                  key={app._id}
                  className="p-6 bg-cream border-champagne-border hover:shadow-soft-emerald transition-all"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                    {/* Left: Candidate Details */}
                    <div className="space-y-3 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {getStatusBadge(app.status)}
                        {cand?.profileCompleteness != null && (
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-champagne text-emerald-ink font-semibold">
                            Profile: {cand.profileCompleteness}%
                          </span>
                        )}
                        <span className="text-xs text-body-text/50 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Applied on {new Date(app.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>

                      <div>
                        <button
                          type="button"
                          onClick={() => setDrawerUserId(candId)}
                          className="font-heading text-lg font-bold text-emerald-ink hover:text-emerald-hover hover:underline text-left transition-colors"
                        >
                          {cand?.name || "Candidate"}
                        </button>
                        {cand?.headline && (
                          <p className="text-xs text-body-text/80 mt-0.5">{cand.headline}</p>
                        )}
                      </div>

                      {/* Match Score Indicator */}
                      <div className="max-w-md">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-semibold text-emerald-ink flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5 text-gold-accent" />
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

                      {/* Candidate Skills Pills */}
                      {cand?.skills && cand.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {cand.skills.map((skill, sIdx) => {
                            const isMatch = jobSkillsSet.has(skill.toLowerCase());
                            return (
                              <span
                                key={sIdx}
                                className={`text-[11px] px-2 py-0.5 rounded-md font-medium ${
                                  isMatch
                                    ? "bg-emerald/10 text-emerald-dark font-semibold border border-emerald/30"
                                    : "bg-champagne/40 text-body-text/70"
                                }`}
                              >
                                {skill}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Right: Actions & Profile Link */}
                    <div className="flex flex-col items-end gap-3 shrink-0">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setDrawerUserId(candId)}
                        className="text-xs w-full sm:w-auto"
                      >
                        View Full Profile
                      </Button>

                      {/* Decision Action Buttons */}
                      {!isWithdrawn && (
                        <div className="flex flex-wrap items-center gap-1.5">
                          {app.status !== "shortlisted" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenActionModal(app, "shortlisted")}
                              className="text-xs text-gold-accent hover:border-gold-accent"
                            >
                              Shortlist
                            </Button>
                          )}

                          {app.status !== "hired" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenActionModal(app, "hired")}
                              className="text-xs text-emerald hover:border-emerald font-semibold"
                            >
                              Hire
                            </Button>
                          )}

                          {app.status !== "rejected" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenActionModal(app, "rejected")}
                              className="text-xs text-error-red hover:bg-error-bg"
                            >
                              Reject
                            </Button>
                          )}
                        </div>
                      )}

                      {isWithdrawn && (
                        <span className="text-xs text-body-text/50 italic">
                          Candidate withdrew application
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Recruiter Note if present */}
                  {app.recruiterNote && (
                    <div className="mt-4 p-3 rounded-xl bg-gold-badge/50 border border-gold-accent/20 text-xs text-body-text">
                      <span className="font-semibold text-emerald-ink block mb-0.5">
                        Your Feedback Note:
                      </span>
                      <p>{app.recruiterNote}</p>
                    </div>
                  )}

                  {/* Cover Note Dropdown */}
                  {app.coverNote && (
                    <div className="mt-3 pt-3 border-t border-champagne-border/50">
                      <button
                        onClick={() => toggleExpand(app._id)}
                        className="flex items-center gap-1 text-xs font-medium text-emerald-ink/80 hover:text-emerald-ink transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>{isExpanded ? "Hide Cover Note" : "Read Cover Note"}</span>
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
                </Card>
              );
            })}

            {/* Pagination */}
            {appsData.totalPages > 1 && (
              <div className="pt-4 flex justify-center">
                <Pagination
                  currentPage={appsData.page}
                  totalPages={appsData.totalPages}
                  onPageChange={(p) => setPage(p)}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Dialog (Shortlist / Reject / Hire) */}
      <Modal
        isOpen={Boolean(actionTarget)}
        onClose={() => setActionTarget(null)}
        title={
          actionTarget?.status === "shortlisted"
            ? "Shortlist Candidate"
            : actionTarget?.status === "hired"
            ? "Hire Candidate"
            : "Mark Candidate as Not Selected"
        }
        description={`Update application status for ${
          (actionTarget?.app.candidate as CandidateApplicantSummary)?.name || "candidate"
        }.`}
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="recruiterNote" className="block text-xs font-semibold text-emerald-ink mb-1">
              Feedback Note to Candidate (Optional)
            </label>
            <p className="text-[11px] text-body-text/70 mb-2">
              This note will be visible to the candidate and included in their status notification email.
            </p>
            <textarea
              id="recruiterNote"
              rows={3}
              maxLength={500}
              value={recruiterNote}
              onChange={(e) => setRecruiterNote(e.target.value)}
              placeholder="e.g. Impressed with your frontend portfolio projects, we would like to schedule an interview."
              className="w-full px-3 py-2 text-sm rounded-xl bg-champagne/20 border border-champagne-border text-body-text placeholder:text-body-text/40 focus:outline-none focus:ring-2 focus:ring-gold-accent transition-all resize-none"
            />
            <span className="text-[11px] text-body-text/60 block mt-1">
              {recruiterNote.length} / 500 characters
            </span>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-champagne-border/60">
            <Button
              type="button"
              variant="outline"
              onClick={() => setActionTarget(null)}
              disabled={updateStatusMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant={
                actionTarget?.status === "hired"
                  ? "primary"
                  : actionTarget?.status === "shortlisted"
                  ? "gold"
                  : "danger"
              }
              onClick={handleConfirmAction}
              isLoading={updateStatusMutation.isPending}
            >
              Confirm Status Update
            </Button>
          </div>
        </div>
      </Modal>

      {/* Candidate Profile Slide-over Drawer */}
      {drawerUserId && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-sm flex justify-end transition-opacity">
          <div className="w-full max-w-xl bg-cream h-full shadow-2xl flex flex-col border-l border-champagne-border overflow-hidden">
            {/* Drawer Header */}
            <div className="p-5 border-b border-champagne-border flex items-center justify-between bg-champagne/30">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-gold-accent" />
                <h3 className="font-heading text-lg font-bold text-emerald-ink">
                  Candidate Profile
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDrawerUserId(null)}
                className="p-1.5 rounded-lg hover:bg-champagne text-body-text/70 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {isDrawerLoading ? (
                <BrandLoader message="Fetching candidate details..." fullScreen={false} />
              ) : !drawerProfile ? (
                <p className="text-xs text-body-text/60 text-center py-10">
                  Profile details not found.
                </p>
              ) : (
                <div className="space-y-6">
                  {/* Basic */}
                  <div>
                    <h2 className="font-heading text-xl font-bold text-emerald-ink">
                      {drawerProfile.user?.name || "Candidate"}
                    </h2>
                    {drawerProfile.headline && (
                      <p className="text-sm text-body-text/80 mt-1">{drawerProfile.headline}</p>
                    )}
                    {drawerProfile.location && (
                      <p className="text-xs text-body-text/60 flex items-center gap-1 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-gold-accent" />
                        {[drawerProfile.location.city, drawerProfile.location.state]
                          .filter(Boolean)
                          .join(", ") || "Location not specified"}
                      </p>
                    )}
                  </div>

                  {/* About */}
                  {drawerProfile.about && (
                    <div>
                      <h4 className="text-xs font-semibold text-emerald-ink uppercase tracking-wider mb-1">
                        About
                      </h4>
                      <p className="text-xs text-body-text leading-relaxed whitespace-pre-line">
                        {drawerProfile.about}
                      </p>
                    </div>
                  )}

                  {/* Skills */}
                  {drawerProfile.skills && drawerProfile.skills.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-emerald-ink uppercase tracking-wider mb-2">
                        Skills
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {drawerProfile.skills.map((s, idx) => (
                          <span
                            key={idx}
                            className="text-xs px-2.5 py-1 rounded-lg bg-champagne text-emerald-ink font-medium"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Projects */}
                  {drawerProfile.projects && drawerProfile.projects.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-emerald-ink uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <FolderGit2 className="w-4 h-4 text-gold-accent" />
                        Projects
                      </h4>
                      <div className="space-y-3">
                        {drawerProfile.projects.map((proj, idx) => (
                          <div
                            key={idx}
                            className="p-3 rounded-xl bg-champagne/20 border border-champagne-border text-xs space-y-1"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-emerald-ink">{proj.title}</span>
                              {proj.link && (
                                <a
                                  href={proj.link}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-gold-accent hover:underline flex items-center gap-1"
                                >
                                  Link <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                            {proj.description && (
                              <p className="text-body-text/70">{proj.description}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Education */}
                  {drawerProfile.education && drawerProfile.education.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-emerald-ink uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <GraduationCap className="w-4 h-4 text-gold-accent" />
                        Education
                      </h4>
                      <div className="space-y-2">
                        {drawerProfile.education.map((edu, idx) => (
                          <div
                            key={idx}
                            className="p-3 rounded-xl bg-champagne/20 border border-champagne-border text-xs"
                          >
                            <span className="font-semibold text-emerald-ink block">{edu.degree}</span>
                            <span className="text-body-text/70">
                              {edu.institute} {edu.year ? `• ${edu.year}` : ""}{" "}
                              {edu.grade ? `(${edu.grade})` : ""}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Experience */}
                  {drawerProfile.experience && drawerProfile.experience.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-emerald-ink uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Briefcase className="w-4 h-4 text-gold-accent" />
                        Experience
                      </h4>
                      <div className="space-y-2">
                        {drawerProfile.experience.map((exp, idx) => (
                          <div
                            key={idx}
                            className="p-3 rounded-xl bg-champagne/20 border border-champagne-border text-xs"
                          >
                            <span className="font-semibold text-emerald-ink block">
                              {exp.title} at {exp.company}
                            </span>
                            {exp.description && (
                              <p className="text-body-text/70 mt-1">{exp.description}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Portfolio & Links */}
                  <div className="pt-2 border-t border-champagne-border/60 space-y-2">
                    <h4 className="text-xs font-semibold text-emerald-ink uppercase tracking-wider">
                      Portfolio & Links
                    </h4>
                    <div className="flex flex-wrap gap-3 text-xs">
                      {drawerProfile.links?.github && (
                        <a
                          href={drawerProfile.links.github}
                          target="_blank"
                          rel="noreferrer"
                          className="text-emerald-ink hover:underline flex items-center gap-1"
                        >
                          <Globe className="w-3.5 h-3.5" /> GitHub
                        </a>
                      )}
                      {drawerProfile.links?.linkedin && (
                        <a
                          href={drawerProfile.links.linkedin}
                          target="_blank"
                          rel="noreferrer"
                          className="text-emerald-ink hover:underline flex items-center gap-1"
                        >
                          <Globe className="w-3.5 h-3.5" /> LinkedIn
                        </a>
                      )}
                      {drawerProfile.links?.portfolio && (
                        <a
                          href={drawerProfile.links.portfolio}
                          target="_blank"
                          rel="noreferrer"
                          className="text-emerald-ink hover:underline flex items-center gap-1"
                        >
                          <Globe className="w-3.5 h-3.5" /> Portfolio
                        </a>
                      )}
                    </div>

                    {drawerProfile.resumeUrl && (
                      <div className="pt-2">
                        <a
                          href={drawerProfile.resumeUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald text-white text-xs font-semibold shadow-sm hover:brightness-105 transition-all"
                        >
                          <FileText className="w-3.5 h-3.5" /> View Resume Document
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

