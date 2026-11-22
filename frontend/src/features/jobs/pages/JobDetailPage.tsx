"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Job } from "../../../types/job";
import { formatSalary } from "../utils";
import { useJobDetail, useApplyJob } from "../hooks/useJobs";
import { useMyApplications } from "../../applications/hooks/useApplications";
import { useAppSelector } from "../../../config/store";
import { selectUser, selectIsAuthenticated } from "../../auth/state/authSlice";
import { Card } from "../../../components/ui/Card";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { Modal } from "../../../components/ui/Modal";
import { BrandLoader } from "../../../components/feedback/BrandLoader";
import { ErrorState } from "../../../components/feedback/ErrorState";
import { BookmarkButton } from "../components/BookmarkButton";
import { JobMatchCard } from "../components/JobMatchCard";
import { CoverLetterModal } from "../components/CoverLetterModal";
import { ConsentDialog } from "../../resume-check/components/ConsentDialog";
import { apiClient } from "../../../config/api";
import { toast } from "sonner";
import {
  Briefcase,
  MapPin,
  Sparkles,
  IndianRupee,
  Calendar,
  Users,
  Building2,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

export interface JobDetailPageProps {
  jobId: string;
  initialJob?: Job;
}

export const JobDetailPage: React.FC<JobDetailPageProps> = ({ jobId, initialJob }) => {
  const router = useRouter();
  const user = useAppSelector(selectUser);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  const { data: job, isLoading, isError, error } = useJobDetail(jobId, initialJob);

  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [isCoverLetterOpen, setIsCoverLetterOpen] = useState(false);
  const [coverNote, setCoverNote] = useState("");
  const [hasAppliedLocal, setHasAppliedLocal] = useState(false);

  // Draft with AI states for cover note
  const [isDraftingNote, setIsDraftingNote] = useState(false);
  const [isNoteConsentOpen, setIsNoteConsentOpen] = useState(false);
  const [showReplaceConfirm, setShowReplaceConfirm] = useState(false);
  const [pendingNoteDraft, setPendingNoteDraft] = useState<string | null>(null);
  const [showBracketConfirm, setShowBracketConfirm] = useState(false);

  // Check if candidate has already applied via their applications list
  const isCandidate = isAuthenticated && user?.role === "candidate";
  const { data: myAppsData } = useMyApplications({ limit: 50 });
  const alreadyAppliedInApps = Boolean(
    myAppsData?.applications.some((app) =>
      typeof app.job === "string" ? app.job === jobId : app.job?._id === jobId
    )
  );

  const isApplied = hasAppliedLocal || alreadyAppliedInApps;

  const applyMutation = useApplyJob();

  if (isLoading && !job) {
    return <BrandLoader message="Loading job opening..." />;
  }

  if (isError || !job) {
    return (
      <div className="min-h-screen bg-champagne/40 py-16 px-4">
        <div className="max-w-xl mx-auto">
          <ErrorState
            title="Job Not Found"
            message="This job listing may have expired, been removed, or is no longer accepting applications."
            onRetry={() => router.push("/jobs")}
          />
        </div>
      </div>
    );
  }

  const isDeadlinePassed = job.applicationDeadline
    ? new Date(job.applicationDeadline).getTime() < Date.now()
    : false;
  const isClosed = job.status !== "open" || isDeadlinePassed;

  const handleApplyClick = () => {
    if (!isAuthenticated) {
      router.push(`/login?next=/jobs/${job._id}`);
      return;
    }
    if (user?.role !== "candidate") {
      toast.error("Only candidates can apply to job openings.");
      return;
    }
    setIsApplyModalOpen(true);
  };

  const remainingBrackets = coverNote.match(/\[[^\]]+\]/g) || [];

  const executeDraftNote = async (grantedConsent = false) => {
    setIsDraftingNote(true);
    try {
      const res = await apiClient<{
        aiAvailable: boolean;
        body?: string;
        message?: string;
      }>("/api/cover-letter/generate", {
        method: "POST",
        body: JSON.stringify({
          jobId: job._id,
          tone: "professional",
          format: "note",
          consent: grantedConsent ? true : undefined,
        }),
      });

      if (res.data?.aiAvailable && res.data.body) {
        const generatedNote = res.data.body;
        if (coverNote.trim().length > 0) {
          setPendingNoteDraft(generatedNote);
          setShowReplaceConfirm(true);
        } else {
          const prev = coverNote;
          setCoverNote(generatedNote);
          toast.success("Cover note drafted with AI!", {
            action: {
              label: "Undo",
              onClick: () => setCoverNote(prev),
            },
          });
        }
      } else {
        toast.error(
          res.data?.message || "Generated note did not meet verification standards. Please try again."
        );
      }
    } catch (err: any) {
      const status = err?.statusCode || err?.response?.status;
      const msg = err?.message || err?.response?.data?.message || "";

      if (status === 400 && msg.includes("AI consent is required")) {
        setIsNoteConsentOpen(true);
        return;
      }
      if (status === 400 && msg.includes("upload your resume")) {
        toast.error("Please upload your resume in PDF format first.", {
          action: {
            label: "Go to Profile",
            onClick: () => router.push("/candidate/profile"),
          },
        });
        return;
      }
      if (status === 429) {
        toast.error(
          msg || "You have reached your daily cover letter limit. Please try again tomorrow."
        );
        return;
      }
      if (status === 503) {
        toast.error("AI is unavailable right now, try again later.");
        return;
      }
      toast.error(msg || "Failed to generate note.");
    } finally {
      setIsDraftingNote(false);
    }
  };

  const doSubmitApplication = async () => {
    try {
      await applyMutation.mutateAsync({
        jobId: job._id,
        coverNote: coverNote.trim() || undefined,
      });
      setHasAppliedLocal(true);
      setIsApplyModalOpen(false);
      setShowBracketConfirm(false);
      setCoverNote("");
      toast.success("Application submitted successfully!");
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Failed to submit application.";
      if (err?.response?.status === 409 || msg.includes("already applied")) {
        setHasAppliedLocal(true);
        setIsApplyModalOpen(false);
        setShowBracketConfirm(false);
        toast.info("You have already applied for this job.");
      } else if (msg.includes("Complete your profile")) {
        setIsApplyModalOpen(false);
        setShowBracketConfirm(false);
        toast.error("Please complete your profile before applying.", {
          action: {
            label: "Edit Profile",
            onClick: () => router.push("/candidate/profile"),
          },
        });
      } else {
        toast.error(msg);
      }
    }
  };

  const handleApplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (coverNote.length > 1000) {
      toast.error("Cover note cannot exceed 1000 characters.");
      return;
    }
    if (remainingBrackets.length > 0) {
      setShowBracketConfirm(true);
      return;
    }
    doSubmitApplication();
  };

  const salaryDisplay = formatSalary(job.salary);
  const locationText = [job.location?.city, job.location?.state].filter(Boolean).join(", ") || "Location not specified";

  // JSON-LD Schema for JobPosting
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: job.description,
    datePosted: job.createdAt,
    validThrough: job.applicationDeadline || undefined,
    employmentType: job.jobType?.toUpperCase(),
    hiringOrganization: {
      "@type": "Organization",
      name: job.companyName,
    },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: job.location?.city || "Remote",
        addressRegion: job.location?.state || "",
        addressCountry: "IN",
      },
    },
    baseSalary:
      job.salary?.isVisible && job.salary?.min
        ? {
            "@type": "MonetaryAmount",
            currency: job.salary.currency || "INR",
            value: {
              "@type": "QuantitativeValue",
              minValue: job.salary.min,
              maxValue: job.salary.max || job.salary.min,
              unitText: "YEAR",
            },
          }
        : undefined,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="min-h-screen bg-champagne/40 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Back link */}
          <Link
            href="/jobs"
            className="inline-flex items-center gap-2 text-sm font-medium text-emerald-ink/80 hover:text-emerald-ink mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Jobs
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Left 2 Cols: Main Job Details */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="p-6 sm:p-8 bg-cream border-champagne-border">
                {/* Header */}
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-champagne-border/60 pb-6 mb-6">
                  <div>
                    <div className="flex items-center gap-2 text-sm text-body-text/70 mb-2 font-medium">
                      <Building2 className="w-4 h-4 text-gold-accent" />
                      <span>{job.companyName}</span>
                    </div>
                    <h1 className="font-heading text-2xl sm:text-3xl font-bold text-emerald-ink">
                      {job.title}
                    </h1>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <BookmarkButton
                      jobId={job._id}
                      size="md"
                      showLabel
                      className="px-3 py-1.5 bg-champagne/80 hover:bg-champagne border border-champagne-border/80 shadow-emerald-sm"
                    />
                    {job.isFresherFriendly && (
                      <Badge variant="fresher" className="gap-1 px-3 py-1 text-xs">
                        <Sparkles className="w-3.5 h-3.5" />
                        Fresher Friendly
                      </Badge>
                    )}
                    <Badge variant="default" className="capitalize text-xs">
                      {job.workMode}
                    </Badge>
                    <Badge variant="outline" className="capitalize text-xs">
                      {job.jobType.replace("_", " ")}
                    </Badge>
                    {isClosed && (
                      <Badge variant="error" className="text-xs">
                        Closed
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Quick Info Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-champagne/30 border border-champagne-border/60 mb-6">
                  <div>
                    <span className="text-xs text-body-text/60 font-medium block mb-1">
                      Salary (LPA)
                    </span>
                    <span className="text-sm font-semibold text-emerald-ink flex items-center gap-1">
                      <IndianRupee className="w-3.5 h-3.5 text-gold-accent" />
                      {salaryDisplay}
                    </span>
                  </div>

                  <div>
                    <span className="text-xs text-body-text/60 font-medium block mb-1">
                      Experience
                    </span>
                    <span className="text-sm font-semibold text-emerald-ink flex items-center gap-1">
                      <Briefcase className="w-3.5 h-3.5 text-gold-accent" />
                      {job.experience?.minYears === 0
                        ? "0 yrs (Freshers)"
                        : `${job.experience?.minYears || 0} - ${job.experience?.maxYears || 0} yrs`}
                    </span>
                  </div>

                  <div>
                    <span className="text-xs text-body-text/60 font-medium block mb-1">
                      Location
                    </span>
                    <span className="text-sm font-semibold text-emerald-ink flex items-center gap-1 truncate">
                      <MapPin className="w-3.5 h-3.5 text-gold-accent shrink-0" />
                      <span className="truncate">{locationText}</span>
                    </span>
                  </div>

                  <div>
                    <span className="text-xs text-body-text/60 font-medium block mb-1">
                      Openings
                    </span>
                    <span className="text-sm font-semibold text-emerald-ink flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-gold-accent" />
                      {job.openings}
                    </span>
                  </div>
                </div>

                {/* Required Skills */}
                {job.skills && job.skills.length > 0 && (
                  <div className="mb-6">
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-emerald-ink/80 mb-3">
                      Required Skills
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {job.skills.map((skill, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 rounded-lg bg-emerald-ink/5 text-emerald-ink text-xs font-medium border border-emerald-ink/10"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Full Description */}
                <div>
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-emerald-ink/80 mb-3">
                    Job Description
                  </h2>
                  <div className="prose prose-emerald max-w-none text-body-text text-sm leading-relaxed whitespace-pre-line">
                    {job.description}
                  </div>
                </div>

                {/* Application Deadline Note */}
                {job.applicationDeadline && (
                  <div className="mt-8 pt-4 border-t border-champagne-border/60 flex items-center gap-2 text-xs text-body-text/70">
                    <Calendar className="w-4 h-4 text-gold-accent" />
                    <span>
                      Application deadline:{" "}
                      <strong>
                        {new Date(job.applicationDeadline).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </strong>
                    </span>
                  </div>
                )}
              </Card>
            </div>

            {/* Right Column: Sticky Apply Card & Match Breakdown */}
            <div className="lg:col-span-1 lg:sticky lg:top-24 space-y-4">
              {/* How Well Do You Match Card (Candidate Only) */}
              <JobMatchCard jobId={job._id} />

              <Card className="p-6 bg-cream border-champagne-border shadow-soft-emerald">
                <h3 className="font-heading text-lg font-bold text-emerald-ink mb-1">
                  Ready to apply?
                </h3>
                <p className="text-xs text-body-text/70 mb-4">
                  Submit your application directly to the hiring team at {job.companyName}.
                </p>

                <div className="space-y-3 mb-6 border-y border-champagne-border/60 py-4 text-xs">
                  <div className="flex justify-between">
                    <span className="text-body-text/70">Role:</span>
                    <span className="font-semibold text-emerald-ink">{job.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-body-text/70">Work mode:</span>
                    <span className="font-semibold capitalize text-emerald-ink">{job.workMode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-body-text/70">Compensation:</span>
                    <span className="font-semibold text-emerald-ink">{salaryDisplay}</span>
                  </div>
                </div>

                {/* Apply Button State */}
                {isClosed ? (
                  <Button disabled variant="secondary" className="w-full opacity-70">
                    Applications Closed
                  </Button>
                ) : isApplied ? (
                  <Button disabled variant="secondary" className="w-full gap-2 !bg-success-bg !text-success !border-success-border font-semibold">
                    <CheckCircle2 className="w-4 h-4" />
                    Applied
                  </Button>
                ) : user?.role === "recruiter" ? (
                  <div className="p-3 bg-champagne/40 rounded-xl border border-champagne-border text-center text-xs text-body-text/80">
                    You are logged in as a recruiter. Switch to a candidate account to apply.
                  </div>
                ) : (
                  <Button
                    onClick={handleApplyClick}
                    variant="primary"
                    className="w-full shadow-md hover:shadow-lg transition-all"
                  >
                    {!isAuthenticated ? "Sign in to Apply" : "Apply Now"}
                  </Button>
                )}

                {/* AI Cover Letter Button (Candidate Only, Job Open) */}
                {!isClosed && (!isAuthenticated || isCandidate) && (
                  <div className="mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (!isAuthenticated) {
                          router.push(`/login?next=/jobs/${job._id}`);
                          return;
                        }
                        setIsCoverLetterOpen(true);
                      }}
                      className="w-full gap-2 text-xs border-gold-accent/40 hover:border-gold-accent hover:bg-gold-accent/5 text-emerald-ink font-semibold"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-gold-accent" />
                      Write a cover letter
                    </Button>
                  </div>
                )}

                {!isAuthenticated && (
                  <p className="text-[11px] text-center text-body-text/60 mt-3">
                    Don&apos;t have an account?{" "}
                    <Link href="/register" className="text-emerald-ink font-semibold underline">
                      Sign up free
                    </Link>
                  </p>
                )}
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Cover Note Modal */}
      <Modal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        title={`Apply to ${job.companyName}`}
        description={`Submitting application for ${job.title}`}
      >
        <form onSubmit={handleApplySubmit} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="coverNote" className="block text-xs font-semibold text-emerald-ink">
                Cover Note (Optional)
              </label>
              {!isClosed && isCandidate && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => executeDraftNote()}
                  isLoading={isDraftingNote}
                  disabled={isDraftingNote}
                  className="gap-1.5 text-[11px] h-7 px-2.5 border-gold-accent/40 hover:border-gold-accent hover:bg-gold-accent/5 text-emerald-ink font-medium"
                >
                  <Sparkles className="w-3 h-3 text-gold-accent" />
                  Draft with AI
                </Button>
              )}
            </div>
            <p className="text-[11px] text-body-text/70 mb-1">
              Highlight your top projects, relevant skills, or why you are a great fit for this role.
            </p>
            <p className="text-[11px] text-gold-accent/90 italic mb-2">
              Draft from your resume. Check every sentence and fill the [brackets] before applying.
            </p>
            <textarea
              id="coverNote"
              rows={5}
              maxLength={1000}
              value={coverNote}
              onChange={(e) => setCoverNote(e.target.value)}
              placeholder="e.g. Hello hiring team, I have built several projects using React and Node.js..."
              className="w-full px-3 py-2 text-sm rounded-xl bg-champagne/20 border border-champagne-border text-body-text placeholder:text-body-text/40 focus:outline-none focus:ring-2 focus:ring-gold-accent transition-all resize-none"
            />
            {remainingBrackets.length > 0 && (
              <div className="mt-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-700 dark:text-amber-300 flex items-start gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <div>
                  <span className="font-semibold">Unfilled placeholders: </span>
                  {Array.from(new Set(remainingBrackets)).join(", ")}
                </div>
              </div>
            )}
            <div className="flex justify-between items-center text-[11px] text-body-text/60 mt-1">
              <span>Maximum 1,000 characters</span>
              <span className={coverNote.length > 950 ? "text-error-red font-semibold" : ""}>
                {coverNote.length} / 1000
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-champagne-border/60">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsApplyModalOpen(false)}
              disabled={applyMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={applyMutation.isPending}
            >
              Submit Application
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirm Replace Modal */}
      <Modal
        isOpen={showReplaceConfirm}
        onClose={() => {
          setShowReplaceConfirm(false);
          setPendingNoteDraft(null);
        }}
        title="Replace existing cover note?"
        description="Your current note will be replaced with the AI-drafted note."
      >
        <div className="space-y-4">
          <p className="text-xs text-body-text/80">
            You already typed a note. Would you like to overwrite it with the AI draft? You will still be able to undo via notification.
          </p>
          <div className="flex justify-end gap-3 pt-2 border-t border-champagne-border/60">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowReplaceConfirm(false);
                setPendingNoteDraft(null);
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={() => {
                const prev = coverNote;
                setCoverNote(pendingNoteDraft || "");
                setShowReplaceConfirm(false);
                setPendingNoteDraft(null);
                toast.success("Cover note replaced with AI draft!", {
                  action: {
                    label: "Undo",
                    onClick: () => setCoverNote(prev),
                  },
                });
              }}
            >
              Replace
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirm Bracket Modal */}
      <Modal
        isOpen={showBracketConfirm}
        onClose={() => setShowBracketConfirm(false)}
        title="Placeholders Detected"
        description="Your note still contains brackets."
      >
        <div className="space-y-4">
          <p className="text-xs text-body-text/80">
            Your note still has [brackets] ({Array.from(new Set(remainingBrackets)).join(", ")}). Send anyway?
          </p>
          <div className="flex justify-end gap-3 pt-2 border-t border-champagne-border/60">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowBracketConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={() => doSubmitApplication()}
              isLoading={applyMutation.isPending}
            >
              Send anyway
            </Button>
          </div>
        </div>
      </Modal>

      {/* Consent Dialog for Note */}
      <ConsentDialog
        isOpen={isNoteConsentOpen}
        onCancel={() => setIsNoteConsentOpen(false)}
        onConfirm={async () => {
          setIsNoteConsentOpen(false);
          await executeDraftNote(true);
        }}
      />

      {/* AI Cover Letter Drawer/Modal */}
      <CoverLetterModal
        isOpen={isCoverLetterOpen}
        onClose={() => setIsCoverLetterOpen(false)}
        jobId={job._id}
        jobTitle={job.title}
        companyName={job.companyName}
      />
    </>
  );
};
