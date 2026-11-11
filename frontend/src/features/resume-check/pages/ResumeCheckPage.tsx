"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { profileApi } from "../../profile/services/profile.api";
import {
  useResumeAnalyses,
  useAnalyzeResumeMutation,
  useDeleteAnalysisMutation,
  useClearAllAnalysesMutation,
  useWithdrawConsentMutation,
} from "../hooks/useResumeCheck";
import { ResumeAnalysis } from "../types";
import { ScoreRing } from "../components/ScoreRing";
import { StatTile } from "../components/StatTile";
import { QuickInsights } from "../components/QuickInsights";
import { ResumePdfPreview } from "../components/ResumePdfPreview";
import { SectionScores } from "../components/SectionScores";
import { IssuesRisksList } from "../components/IssuesRisksList";
import { KeywordsAnalysis } from "../components/KeywordsAnalysis";
import { TopSuggestions } from "../components/TopSuggestions";
import { BulletRewrites } from "../components/BulletRewrites";
import { ConsentDialog } from "../components/ConsentDialog";
import { TargetJobSelector } from "../components/TargetJobSelector";
import { HistoryDrawer } from "../components/HistoryDrawer";
import { Card } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { ROUTES } from "../../../constants/routes";
import { ApiClientError } from "../../../config/api";
import {
  Sparkles,
  FileText,
  Upload,
  History,
  AlertCircle,
  CheckCircle2,
  Clock,
  Briefcase,
  Layers,
  ArrowRight,
  ShieldAlert,
  RotateCw,
} from "lucide-react";

export const ResumeCheckPage: React.FC = () => {
  // 1. Fetch Candidate Profile to check if resume is uploaded
  const { data: profileRes, isLoading: isLoadingProfile } = useQuery({
    queryKey: ["profile", "me"],
    queryFn: async () => {
      const res = await profileApi.getProfileMe();
      return res.data;
    },
  });

  const profile = profileRes as any;
  const hasResume = Boolean(profile?.resume?.fileId);

  // 2. Fetch history of analyses
  const { data: historyData, isLoading: isLoadingHistory } = useResumeAnalyses(1);
  const analysesList = historyData?.analyses || [];

  // Active analysis displayed (either newly analyzed or picked from history)
  const [currentAnalysis, setCurrentAnalysis] = useState<ResumeAnalysis | null>(null);

  // Auto-select latest analysis from history on initial load if none selected
  useEffect(() => {
    if (!currentAnalysis && analysesList.length > 0) {
      // Fetch full details of the latest one
      import("../services/resumeCheck.api").then(({ resumeCheckApi }) => {
        resumeCheckApi.getAnalysisById(analysesList[0]._id).then((res) => {
          if (res.data) setCurrentAnalysis(res.data);
        }).catch(() => {});
      });
    }
  }, [analysesList, currentAnalysis]);

  // Form State
  const [targetMode, setTargetMode] = useState<"none" | "job" | "description">("none");
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [jobDescription, setJobDescription] = useState<string>("");
  const [consentModalOpen, setConsentModalOpen] = useState(false);
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);

  // Stepped loading progress
  const [loadingStep, setLoadingStep] = useState<number>(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const analyzeMutation = useAnalyzeResumeMutation();
  const deleteMutation = useDeleteAnalysisMutation();
  const clearAllMutation = useClearAllAnalysesMutation();
  const withdrawConsentMutation = useWithdrawConsentMutation();

  const loadingStepsText = [
    "Reading resume document from storage...",
    "Verifying document formatting and section layout...",
    "Matching skills against target benchmarks...",
    "Synthesizing high-impact recommendations...",
  ];

  // Initiate analysis flow
  const triggerAnalysis = async (grantedConsent: boolean = false) => {
    setErrorMessage(null);
    setIsAnalyzing(true);
    setLoadingStep(0);

    const stepInterval = setInterval(() => {
      setLoadingStep((prev) => (prev < 3 ? prev + 1 : prev));
    }, 1800);

    try {
      const payload = {
        jobId: targetMode === "job" ? selectedJobId || undefined : undefined,
        jobDescription: targetMode === "description" ? jobDescription || undefined : undefined,
        consent: grantedConsent ? true : undefined,
      };

      const result = await analyzeMutation.mutateAsync(payload);
      clearInterval(stepInterval);
      if (result) {
        setCurrentAnalysis(result);
      }
    } catch (err: any) {
      clearInterval(stepInterval);
      if (err instanceof ApiClientError) {
        // If consent required, trigger modal
        if (err.statusCode === 400 && err.message.toLowerCase().includes("consent")) {
          setConsentModalOpen(true);
          return;
        }
        setErrorMessage(err.message);
      } else {
        setErrorMessage("An unexpected error occurred while analyzing your resume. Please try again.");
      }
    } finally {
      setIsAnalyzing(false);
      setLoadingStep(0);
    }
  };

  const handleConsentConfirm = () => {
    setConsentModalOpen(false);
    triggerAnalysis(true);
  };

  const handleSelectHistoryItem = async (id: string) => {
    try {
      const { resumeCheckApi } = await import("../services/resumeCheck.api");
      const res = await resumeCheckApi.getAnalysisById(id);
      if (res.data) {
        setCurrentAnalysis(res.data);
      }
    } catch {
      // ignore
    }
  };

  const handleDeleteHistoryItem = async (id: string) => {
    await deleteMutation.mutateAsync(id);
    if (currentAnalysis?._id === id) {
      setCurrentAnalysis(null);
    }
  };

  const handleClearAllHistory = async () => {
    await clearAllMutation.mutateAsync();
    setCurrentAnalysis(null);
  };

  // ── Edge State: No Resume Uploaded ──────────────────────────────────────────
  if (!isLoadingProfile && !hasResume) {
    return (
      <div className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-3 pt-6">
          <div className="w-14 h-14 rounded-2xl bg-gold/15 text-gold border border-gold/30 flex items-center justify-center mx-auto shadow-emerald-sm">
            <Sparkles className="w-7 h-7" />
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-emerald-dark">
            Resume Score Checker
          </h1>
          <p className="text-sm text-body/80 leading-relaxed">
            Upload your resume PDF to unlock automated parsing and layout checks, section-by-section scoring, and recruiter keyword gap analysis.
          </p>
        </div>

        <Card className="p-8 sm:p-12 bg-cream border-2 border-dashed border-border rounded-card text-center space-y-5 max-w-lg mx-auto shadow-emerald-md">
          <div className="w-12 h-12 rounded-full bg-champagne text-emerald flex items-center justify-center mx-auto">
            <Upload className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-emerald-dark">
              No Resume Uploaded Yet
            </h3>
            <p className="text-xs text-muted mt-1 max-w-sm mx-auto leading-relaxed">
              Before running a resume analysis, please upload your PDF resume on your candidate profile page.
            </p>
          </div>
          <Link href={ROUTES.CANDIDATE.PROFILE}>
            <Button variant="primary" size="lg" className="gap-2 shadow-emerald-sm">
              <Upload className="w-4 h-4" />
              <span>Go to Profile &amp; Upload Resume</span>
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      {/* ── Top Header Strip ──────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald/10 text-emerald text-xs font-semibold mb-1.5">
            <Sparkles className="w-3.5 h-3.5 text-gold" />
            <span>AI-Assisted Candidate Diagnostic</span>
          </div>
          <h1 className="font-display text-2xl sm:text-4xl font-bold text-emerald-dark">
            Resume Score Checker
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-1">
            Automated structure, keyword match, and bullet-point impact assessment.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setHistoryDrawerOpen(true)}
            className="text-xs gap-1.5 bg-cream hover:bg-champagne/60"
          >
            <History className="w-4 h-4 text-emerald" />
            <span>Scan History ({analysesList.length})</span>
          </Button>

          <Link href={ROUTES.CANDIDATE.PROFILE}>
            <Button variant="ghost" size="sm" className="text-xs gap-1.5 text-muted hover:text-emerald-dark">
              <FileText className="w-4 h-4" />
              <span>Update Resume PDF</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* ── Honest Disclaimer Notice ───────────────────────────────────────── */}
      <div className="p-3.5 rounded-ui bg-champagne/50 border border-gold/40 text-xs text-emerald-dark flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-gold shrink-0" />
          <span>
            <strong>Resume score notice:</strong> This is an estimate from our own checks, not a result from any employer&apos;s or recruiter&apos;s system.
          </span>
        </div>
        <span className="text-[11px] text-body/70">
          Max 20,000 characters analyzed · Redacted before AI synthesis
        </span>
      </div>

      {/* ── Error Banner ───────────────────────────────────────────────────── */}
      {errorMessage && (
        <div className="p-4 rounded-ui bg-error-bg border border-error-border text-error text-xs font-medium flex items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setErrorMessage(null)}
            className="text-xs text-error hover:bg-error-border/40 p-1 h-auto"
          >
            Dismiss
          </Button>
        </div>
      )}

      {/* ── Stepped Loading State ─────────────────────────────────────────── */}
      {isAnalyzing && (
        <Card className="p-8 sm:p-12 bg-cream border border-border shadow-emerald-lg text-center space-y-6 max-w-xl mx-auto animate-fadeIn">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald to-emerald-dark text-gold flex items-center justify-center mx-auto shadow-emerald-md animate-pulse">
            <RotateCw className="w-7 h-7 animate-spin" />
          </div>

          <div className="space-y-2">
            <h3 className="font-display text-xl font-bold text-emerald-dark">
              Analyzing Your Resume...
            </h3>
            <p className="text-xs text-muted max-w-md mx-auto">
              {loadingStepsText[loadingStep]}
            </p>
          </div>

          <div className="space-y-2 max-w-md mx-auto text-left">
            {loadingStepsText.map((text, i) => {
              const isPast = i < loadingStep;
              const isCurrent = i === loadingStep;
              return (
                <div key={i} className="flex items-center gap-2.5 text-xs">
                  {isPast ? (
                    <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                  ) : isCurrent ? (
                    <div className="w-4 h-4 rounded-full border-2 border-gold border-t-transparent animate-spin shrink-0" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-border shrink-0" />
                  )}
                  <span
                    className={`${
                      isPast
                        ? "text-body font-medium"
                        : isCurrent
                        ? "text-emerald-dark font-bold"
                        : "text-muted"
                    }`}
                  >
                    {text}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* ── "Check My Resume" Control Panel ────────────────────────────────── */}
      {!isAnalyzing && (
        <Card className="p-6 sm:p-8 bg-cream border border-border shadow-emerald-md space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-lg sm:text-xl font-bold text-emerald-dark">
                Configure Resume Scan
              </h2>
              <p className="text-xs text-muted mt-0.5">
                Target an active opening or pasted description for specific keyword overlap, or run a general check.
              </p>
            </div>

            <Button
              variant="primary"
              size="md"
              onClick={() => triggerAnalysis(false)}
              disabled={isAnalyzing}
              className="gap-2 shrink-0 shadow-emerald-sm"
            >
              <Sparkles className="w-4 h-4" />
              <span>{currentAnalysis ? "Re-analyze Resume" : "Analyze My Resume"}</span>
            </Button>
          </div>

          <TargetJobSelector
            mode={targetMode}
            onModeChange={setTargetMode}
            selectedJobId={selectedJobId}
            onSelectJobId={setSelectedJobId}
            jobDescription={jobDescription}
            onJobDescriptionChange={setJobDescription}
            disabled={isAnalyzing}
          />
        </Card>
      )}

      {/* ── Active Analysis Report ────────────────────────────────────────── */}
      {currentAnalysis && !isAnalyzing && (
        <div className="space-y-8 animate-fadeIn">
          {/* Notification: Cached Result Banner */}
          {currentAnalysis.cached && (
            <div className="p-3 rounded-ui bg-champagne/40 border border-border text-xs text-emerald-dark flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald shrink-0" />
                <span>Showing your saved result for this resume and target configuration.</span>
              </div>
              <span className="text-[10px] text-muted uppercase font-bold">Cached</span>
            </div>
          )}

          {/* AI Unavailable Notification */}
          {!currentAnalysis.aiAvailable && (
            <div className="p-3.5 rounded-ui bg-champagne/60 border border-gold/40 text-xs text-emerald-dark flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-gold shrink-0 mt-0.5" />
              <div>
                {(currentAnalysis.stats?.wordCount ?? 0) === 0 ||
                currentAnalysis.stats?.parseRate === 0 ? (
                  <>
                    <strong>Deterministic analysis complete:</strong> AI suggestions were skipped for this image-only PDF because no readable text was detected.
                  </>
                ) : (
                  <>
                    <strong>Deterministic analysis complete:</strong> AI suggestions are unavailable right now. Your score above is still complete.
                  </>
                )}
              </div>
            </div>
          )}

          {/* Scanned PDF High Alert */}
          {currentAnalysis.score === 0 && currentAnalysis.stats?.parseRate === 0 && (
            <div className="p-4 rounded-card bg-error-bg border border-error-border text-error space-y-2">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 shrink-0" />
                <h3 className="font-display text-base font-bold">Unreadable Resume PDF Detected</h3>
              </div>
              <p className="text-xs leading-relaxed text-body">
                Our parser could not extract readable text from your uploaded resume. Scanned PDFs, flat image exports, or multi-layered canvas exports cannot be parsed by automated screening systems. Please re-export your resume as a standard text-based PDF and re-analyze.
              </p>
            </div>
          )}

          {/* 1. Main Score Card & Key Stat Tiles */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Left Column: Big Score Ring (4 cols) */}
            <Card className="lg:col-span-4 p-6 sm:p-8 bg-cream border-border shadow-emerald-md flex flex-col items-center justify-center space-y-4">
              <div className="w-full text-center">
                <span className="text-[10px] uppercase font-bold tracking-wider text-muted">
                  Overall Evaluation
                </span>
                <h3 className="font-display text-xl font-bold text-emerald-dark mt-0.5">
                  Resume Score
                </h3>
              </div>

              <ScoreRing score={currentAnalysis.score} grade={currentAnalysis.grade} />

              <div className="w-full pt-4 border-t border-border/60 text-center">
                <p className="text-[11px] text-muted">
                  File: <strong className="text-body font-semibold">{currentAnalysis.fileName}</strong>
                </p>
              </div>
            </Card>

            {/* Right Column: Metadata & 3 Stat Tiles (8 cols) */}
            <div className="lg:col-span-8 flex flex-col justify-between gap-4">
              <Card className="p-5 sm:p-6 bg-cream border-border shadow-emerald-sm space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gold tracking-wider">
                      Report Snapshot
                    </span>
                    <h3 className="font-display text-xl font-bold text-emerald-dark">
                      Resume Analysis
                    </h3>
                  </div>
                  <span className="text-xs text-muted">
                    Scanned on {new Date(currentAnalysis.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted">Target Objective:</span>{" "}
                    <strong className="text-emerald-dark font-semibold">
                      {currentAnalysis.target?.jobTitle || "General Technical Screening"}
                    </strong>
                  </div>
                  <div>
                    <span className="text-muted">Target Mode:</span>{" "}
                    <span className="capitalize text-body font-medium">
                      {currentAnalysis.target?.type || "General"}
                    </span>
                  </div>
                </div>
              </Card>

              {/* 3 Stat Tiles */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatTile
                  label="Parse Rate"
                  value={`${currentAnalysis.stats.parseRate}%`}
                  subtitle="Readable sections found"
                  icon={<Layers className="w-4 h-4" />}
                />
                <StatTile
                  label="Recruiter Match"
                  value={
                    currentAnalysis.stats.recruiterMatch !== null
                      ? `${currentAnalysis.stats.recruiterMatch}%`
                      : "N/A"
                  }
                  subtitle={
                    currentAnalysis.stats.recruiterMatch !== null
                      ? "Target keyword overlap"
                      : "No target specified"
                  }
                  icon={<Briefcase className="w-4 h-4" />}
                />
                <StatTile
                  label="Experience Level"
                  value={currentAnalysis.stats.experience}
                  subtitle={`${currentAnalysis.stats.approxPages} page(s) · ${currentAnalysis.stats.wordCount} words`}
                  icon={<Clock className="w-4 h-4" />}
                />
              </div>
            </div>
          </div>

          {/* 2. Quick Insights (4 Cards) */}
          <QuickInsights
            insights={currentAnalysis.quickInsights}
            subScores={currentAnalysis.subScores}
            subScoreReasons={currentAnalysis.subScoreReasons}
            stats={currentAnalysis.stats}
          />

          {/* 3. Resume PDF Preview (Iframe) */}
          <ResumePdfPreview fileName={currentAnalysis.fileName} />

          {/* 4. AI Executive Summary, Strengths & Improvements */}
          {currentAnalysis.aiAvailable &&
            currentAnalysis.ai &&
            (Boolean(currentAnalysis.ai.summary) ||
              (currentAnalysis.ai.strengths?.length ?? 0) > 0 ||
              (currentAnalysis.ai.improvements?.length ?? 0) > 0) && (
            <Card className="p-6 sm:p-8 bg-cream border-border shadow-emerald-sm space-y-6">
              {currentAnalysis.ai.summary && (
                <div className="space-y-2">
                  <h3 className="font-display text-lg font-bold text-emerald-dark flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-gold" />
                    <span>Executive Summary</span>
                  </h3>
                  <p className="text-xs sm:text-sm text-body/90 leading-relaxed bg-champagne/25 p-4 rounded-ui border border-border/70">
                    {currentAnalysis.ai.summary}
                  </p>
                </div>
              )}

              {((currentAnalysis.ai.strengths?.length ?? 0) > 0 ||
                (currentAnalysis.ai.improvements?.length ?? 0) > 0) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  {/* Strengths */}
                  {currentAnalysis.ai.strengths?.length > 0 && (
                    <div className="p-4 rounded-ui bg-success-bg/30 border border-success-border space-y-3">
                      <h4 className="text-xs font-bold text-emerald-dark uppercase tracking-wider flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-success" />
                        Key Resume Strengths
                      </h4>
                      <ul className="space-y-2 text-xs text-body/90">
                        {currentAnalysis.ai.strengths.map((s, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-success font-bold">✓</span>
                            <span className="leading-relaxed">{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Improvements */}
                  {currentAnalysis.ai.improvements?.length > 0 && (
                    <div className="p-4 rounded-ui bg-champagne/30 border border-border space-y-3">
                      <h4 className="text-xs font-bold text-gold-hover uppercase tracking-wider flex items-center gap-1.5">
                        <ArrowRight className="w-4 h-4 text-gold" />
                        Areas for Optimization
                      </h4>
                      <ul className="space-y-2 text-xs text-body/90">
                        {currentAnalysis.ai.improvements.map((imp, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-gold font-bold">→</span>
                            <span className="leading-relaxed">{imp}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </Card>
          )}

          {/* 5. Section Scores (Bars & 6 Cards) */}
          <SectionScores
            subScores={currentAnalysis.subScores}
            subScoreReasons={currentAnalysis.subScoreReasons}
          />

          {/* 6. Risks List */}
          <IssuesRisksList issues={currentAnalysis.issues} />

          {/* 7. Keywords Analysis (Present & Missing) */}
          <KeywordsAnalysis
            keywords={currentAnalysis.keywords}
            targetRoleTitle={currentAnalysis.target?.jobTitle}
            hasTarget={currentAnalysis.target?.type !== "none"}
            hasProfileSkills={Array.isArray(profile?.skills) && profile.skills.length > 0}
          />

          {/* 8. Top Suggestions with Copy */}
          {currentAnalysis.aiAvailable && currentAnalysis.ai?.suggestions?.length > 0 && (
            <TopSuggestions suggestions={currentAnalysis.ai.suggestions} />
          )}

          {/* 9. Bullet Rewrites */}
          {currentAnalysis.aiAvailable && currentAnalysis.ai?.bulletRewrites?.length > 0 && (
            <BulletRewrites rewrites={currentAnalysis.ai.bulletRewrites} />
          )}

          {/* 10. Bottom Action CTA */}
          <Card className="p-8 bg-gradient-to-br from-emerald to-emerald-dark text-white rounded-card shadow-emerald-lg flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
            <div className="space-y-1 max-w-lg">
              <h3 className="font-display text-xl sm:text-2xl font-bold">
                Ready to improve your score?
              </h3>
              <p className="text-xs sm:text-sm text-champagne/80">
                Update your resume with the recommendations above, re-upload to your candidate profile, and rescan anytime.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0 flex-wrap justify-center">
              <Link href={ROUTES.CANDIDATE.PROFILE}>
                <Button variant="secondary" size="md">
                  Update Resume PDF
                </Button>
              </Link>
              <Button
                variant="outline"
                size="md"
                onClick={() => triggerAnalysis(false)}
                className="text-white border-white/40 hover:bg-white/10"
              >
                Re-scan Now
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ── Consent Dialog Modal ───────────────────────────────────────────── */}
      <ConsentDialog
        isOpen={consentModalOpen}
        onConfirm={handleConsentConfirm}
        onCancel={() => setConsentModalOpen(false)}
        isLoading={isAnalyzing}
      />

      {/* ── History Drawer ─────────────────────────────────────────────────── */}
      <HistoryDrawer
        isOpen={historyDrawerOpen}
        onClose={() => setHistoryDrawerOpen(false)}
        analyses={analysesList}
        onSelectAnalysis={handleSelectHistoryItem}
        onDeleteAnalysis={handleDeleteHistoryItem}
        onClearAllAnalyses={handleClearAllHistory}
        onWithdrawConsent={() => withdrawConsentMutation.mutate()}
        isDeleting={deleteMutation.isPending}
        isClearingAll={clearAllMutation.isPending}
      />
    </div>
  );
};
