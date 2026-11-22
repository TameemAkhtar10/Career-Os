"use client";

import React, { useState, useEffect, useRef, Component, ErrorInfo, ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../providers/AuthProvider";
import { useProfileMe } from "../../profile/hooks/useProfile";
import { CandidateProfile } from "../../../types/profile";
import {
  useResumeDraft,
  useSaveResumeDraft,
  useDeleteResumeDraft,
  useUseAsResume,
  useCheckResumeQuality,
} from "../hooks/useResumeBuilder";
import { resumeBuilderApi } from "../services/resumeBuilder.api";
import { ResumeDraftData, QualityCheckResult } from "../types/resumeBuilder.types";
import { ResumeForm } from "../components/ResumeForm";
import { ResumePreview } from "../components/ResumePreview";
import { QualityScoreCard } from "../components/QualityScoreCard";
import { Button } from "../../../components/ui/Button";
import { Modal } from "../../../components/ui/Modal";
import { BrandLoader } from "../../../components/feedback/BrandLoader";
import { ROUTES } from "../../../constants/routes";
import { toast } from "sonner";
import {
  Download,
  FileCheck,
  Trash2,
  Sparkles,
  Check,
  Loader2,
  Layers,
  Eye,
  Edit3,
  ArrowRight,
} from "lucide-react";

// ── Quality Card error boundary ───────────────────────────────────────────────
interface QualityErrorBoundaryState {
  hasError: boolean;
}
class QualityErrorBoundary extends Component<
  { children: ReactNode; onReset: () => void },
  QualityErrorBoundaryState
> {
  constructor(props: { children: ReactNode; onReset: () => void }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(): QualityErrorBoundaryState {
    return { hasError: true };
  }
  componentDidCatch(error: Error, _info: ErrorInfo) {
    console.error("[QualityScoreCard] Render error:", error);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 rounded-xl bg-champagne/20 border border-champagne-border text-center">
          <p className="text-xs text-body-text/70 mb-2">
            Check how automated screening tools and recruiters will read your resume.
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false });
              this.props.onReset();
            }}
            className="text-xs font-semibold text-emerald-ink hover:underline"
          >
            Run quality check
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
// ─────────────────────────────────────────────────────────────────────────────

const INITIAL_DRAFT: ResumeDraftData = {
  template: "classic",
  fullName: "",
  headline: "",
  contact: {
    email: "",
    phone: "",
    city: "",
    linkedin: "",
    github: "",
    portfolio: "",
  },
  summary: "",
  skills: [],
  education: [],
  projects: [],
  experience: [],
  certifications: [],
  sectionOrder: ["summary", "skills", "projects", "experience", "education", "certifications"],
};

export const ResumeBuilderPage: React.FC = () => {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { data: profileMe, isLoading: isProfileLoading } = useProfileMe();
  const candidateProfile = (profileMe as CandidateProfile) || null;

  const { data: serverDraft, isLoading: isDraftLoading } = useResumeDraft();
  const saveMutation = useSaveResumeDraft();
  const deleteMutation = useDeleteResumeDraft();
  const useAsResumeMutation = useUseAsResume();
  const qualityMutation = useCheckResumeQuality();

  const [draft, setDraft] = useState<ResumeDraftData>(INITIAL_DRAFT);
  const [hasLoadedServer, setHasLoadedServer] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [mobileTab, setMobileTab] = useState<"edit" | "preview">("edit");
  const [quality, setQuality] = useState<QualityCheckResult | null>(null);

  const [showUseConfirm, setShowUseConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const qualityTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize draft when server data loads
  // serverDraft is { draft: ResumeDraftData; isPrefill: boolean } | null
  useEffect(() => {
    const draftPayload = serverDraft?.draft ?? null;
    if (draftPayload && !hasLoadedServer) {
      setDraft({
        ...INITIAL_DRAFT,
        ...draftPayload,
        contact: {
          ...INITIAL_DRAFT.contact,
          ...(draftPayload.contact || {}),
        },
        skills: draftPayload.skills || [],
        education: draftPayload.education || [],
        projects: draftPayload.projects || [],
        experience: draftPayload.experience || [],
        certifications: draftPayload.certifications || [],
        sectionOrder:
          draftPayload.sectionOrder?.length > 0
            ? draftPayload.sectionOrder
            : INITIAL_DRAFT.sectionOrder,
      });
      setHasLoadedServer(true);
    }
  }, [serverDraft, hasLoadedServer]);

  // Run initial quality check when draft is loaded
  useEffect(() => {
    if (hasLoadedServer && draft.fullName) {
      qualityMutation.mutate(draft, {
        onSuccess: (res) => {
          // res is ApiResponse<QualityCheckResult>; res.data is the payload
          const payload = res?.data ?? null;
          if (payload) setQuality(payload);
        },
      });
    }
  }, [hasLoadedServer]);

  // Handle draft edits with debounced autosave and quality recalculation
  const handleDraftChange = (updated: ResumeDraftData) => {
    setDraft(updated);
    setSaveStatus("saving");

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      saveMutation.mutate(updated, {
        onSuccess: () => {
          setSaveStatus("saved");
          setTimeout(() => setSaveStatus("idle"), 2500);
        },
        onError: () => {
          setSaveStatus("idle");
        },
      });
    }, 1200);

    // Debounce quality check
    if (qualityTimerRef.current) clearTimeout(qualityTimerRef.current);
    qualityTimerRef.current = setTimeout(() => {
      qualityMutation.mutate(updated, {
        onSuccess: (res) => {
          const payload = res?.data ?? null;
          if (payload) setQuality(payload);
        },
      });
    }, 2000);
  };

  // Download PDF
  const handleDownloadPdf = async () => {
    if (!draft.fullName?.trim()) {
      toast.error("Please enter your name before downloading.");
      return;
    }
    setIsDownloading(true);
    try {
      const { blob, pageCount } = await resumeBuilderApi.downloadPdf(draft);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const cleanName = draft.fullName.replace(/[^a-zA-Z0-9_-]/g, "_");
      link.download = `${cleanName}_Resume.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success(`Resume downloaded (${pageCount} page${pageCount > 1 ? "s" : ""})!`);
    } catch (err: any) {
      toast.error(err.message || "Failed to download PDF.");
    } finally {
      setIsDownloading(false);
    }
  };

  // Use as profile resume
  const handleUseAsResume = async () => {
    if (!draft.fullName?.trim()) {
      toast.error("Please enter your name before saving as your profile resume.");
      return;
    }
    try {
      const res = await useAsResumeMutation.mutateAsync(draft);
      setShowUseConfirm(false);
      toast.success("Resume saved to your profile!", {
        action: {
          label: "Check Resume Score",
          onClick: () => router.push(ROUTES.CANDIDATE.RESUME_CHECK),
        },
      });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to save resume to profile.");
    }
  };

  // Delete draft
  const handleDeleteDraft = async () => {
    try {
      await deleteMutation.mutateAsync();
      setDraft(INITIAL_DRAFT);
      setQuality(null);
      setShowDeleteConfirm(false);
      toast.success("Draft reset to empty.");
    } catch (err: any) {
      toast.error("Failed to delete draft.");
    }
  };

  if (!isAuthenticated && !isProfileLoading) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <h1 className="font-heading text-2xl font-bold text-emerald-ink mb-3">Resume Builder</h1>
        <p className="text-sm text-body-text/70 mb-6">
          Please sign in with your candidate account to build and save your resume.
        </p>
        <Link href={`/login?next=${ROUTES.CANDIDATE.RESUME_BUILDER}`}>
          <Button variant="primary">Sign In to Continue</Button>
        </Link>
      </div>
    );
  }

  if (isDraftLoading && !hasLoadedServer) {
    return (
      <div className="py-24 flex items-center justify-center">
        <BrandLoader message="Loading Resume Builder..." fullScreen={false} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream/30 pb-16">
      {/* Top sticky action header */}
      <div className="sticky top-16 z-30 bg-cream/90 backdrop-blur-md border-b border-champagne-border py-3 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-heading text-xl font-bold text-emerald-ink">Resume Builder</h1>
              {saveStatus === "saving" && (
                <span className="inline-flex items-center gap-1 text-[11px] text-body-text/60 font-medium">
                  <Loader2 className="w-3 h-3 animate-spin text-gold-accent" /> Saving...
                </span>
              )}
              {saveStatus === "saved" && (
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                  <Check className="w-3 h-3" /> Saved
                </span>
              )}
            </div>
            <p className="text-xs text-body-text/70">
              Single-column, text-based format engineered for automated screening tools and hiring teams.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Template Selector */}
            <div className="flex items-center rounded-lg border border-champagne-border bg-white p-0.5 text-xs">
              <button
                type="button"
                onClick={() => handleDraftChange({ ...draft, template: "classic" })}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  draft.template === "classic"
                    ? "bg-emerald text-white shadow-xs"
                    : "text-body-text/70 hover:text-emerald-ink"
                }`}
              >
                Classic
              </button>
              <button
                type="button"
                onClick={() => handleDraftChange({ ...draft, template: "modern" })}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  draft.template === "modern"
                    ? "bg-emerald text-white shadow-xs"
                    : "text-body-text/70 hover:text-emerald-ink"
                }`}
              >
                Modern
              </button>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDownloadPdf}
              isLoading={isDownloading}
              disabled={isDownloading}
              className="text-xs gap-1.5"
            >
              <Download className="w-3.5 h-3.5" /> Download PDF
            </Button>

            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => setShowUseConfirm(true)}
              isLoading={useAsResumeMutation.isPending}
              disabled={useAsResumeMutation.isPending}
              className="text-xs gap-1.5"
            >
              <FileCheck className="w-3.5 h-3.5 text-gold-light" /> Use as profile resume
            </Button>

            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              title="Reset draft"
              className="p-1.5 rounded-lg text-body-text/50 hover:text-error-red hover:bg-champagne/40 ml-1"
              aria-label="Delete draft"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile View Toggle */}
        <div className="md:hidden flex items-center justify-center gap-2 mt-3 pt-2 border-t border-champagne-border/60">
          <button
            type="button"
            onClick={() => setMobileTab("edit")}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold ${
              mobileTab === "edit"
                ? "bg-emerald text-white shadow-xs"
                : "bg-white text-body-text/70 border border-champagne-border"
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" /> Edit Resume
          </button>
          <button
            type="button"
            onClick={() => setMobileTab("preview")}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold ${
              mobileTab === "preview"
                ? "bg-emerald text-white shadow-xs"
                : "bg-white text-body-text/70 border border-champagne-border"
            }`}
          >
            <Eye className="w-3.5 h-3.5" /> Preview & Quality
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* Left Column: Form Editor */}
          <div
            className={`md:col-span-6 lg:col-span-6 ${
              mobileTab === "preview" ? "hidden md:block" : "block"
            }`}
          >
            <ResumeForm
              draft={draft}
              onChange={handleDraftChange}
              candidateProfile={candidateProfile}
            />
          </div>

          {/* Right Column: Preview & Quality Score */}
          <div
            className={`md:col-span-6 lg:col-span-6 space-y-4 md:sticky md:top-36 ${
              mobileTab === "edit" ? "hidden md:block" : "block"
            }`}
          >
            {/* Live Preview */}
            <ResumePreview draft={draft} />

            {/* Quality Score Card */}
            <QualityErrorBoundary onReset={() => { setQuality(null); qualityMutation.reset(); }}>
              <QualityScoreCard
                quality={quality}
                isLoading={qualityMutation.isPending}
                onRefresh={() => qualityMutation.mutate(draft, {
                  onSuccess: (res) => {
                    const payload = res?.data ?? null;
                    if (payload) setQuality(payload);
                  },
                })}
              />
            </QualityErrorBoundary>
          </div>
        </div>
      </div>

      {/* Confirm Use As Profile Resume Modal */}
      <Modal
        isOpen={showUseConfirm}
        onClose={() => setShowUseConfirm(false)}
        title="Save to your profile?"
        description="This will replace your current uploaded resume."
      >
        <div className="space-y-4">
          <p className="text-xs text-body-text/80 leading-relaxed">
            CareerOS will compile your draft into a clean, text-based PDF and attach it as your official profile resume. Any recruiters who view your applications will see this version.
          </p>
          <div className="p-3 rounded-lg bg-champagne/40 border border-champagne-border text-xs text-body-text/70">
            Tip: After saving, you can instantly test it against industry standards in our Resume Score Checker.
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-champagne-border/60">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowUseConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleUseAsResume}
              isLoading={useAsResumeMutation.isPending}
            >
              Confirm & Save
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirm Delete Draft Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Reset Resume Draft?"
        description="This will clear your draft from CareerOS."
      >
        <div className="space-y-4">
          <p className="text-xs text-body-text/80">
            Are you sure you want to delete this draft? This will clear all fields. It will not delete any resume already saved to your profile.
          </p>
          <div className="flex justify-end gap-3 pt-2 border-t border-champagne-border/60">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={handleDeleteDraft}
              isLoading={deleteMutation.isPending}
            >
              Reset Draft
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
