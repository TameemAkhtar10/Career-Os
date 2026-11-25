"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useInterviewPrep } from "@/features/interview-prep/hooks/useInterviewPrep";
import { SetupPanel } from "@/features/interview-prep/components/SetupPanel";
import { ResumeMapCard } from "@/features/interview-prep/components/ResumeMapCard";
import { PracticeMode } from "@/features/interview-prep/components/PracticeMode";
import { FinalReportView } from "@/features/interview-prep/components/FinalReportView";
import { HistoryTab } from "@/features/interview-prep/components/HistoryTab";
import { ConsentDialog } from "@/features/resume-check/components/ConsentDialog";
import { QuestionMix } from "@/features/interview-prep/types/interviewPrep.types";
import { Sparkles, History, BookOpen } from "lucide-react";
import { toast } from "sonner";

export default function CandidateInterviewPrepPage() {
  const searchParams = useSearchParams();
  const initialJobId = searchParams.get("jobId") || undefined;
  const initialRole = searchParams.get("role") || "";

  const [activeTab, setActiveTab] = useState<"practice" | "history">("practice");
  const [showReport, setShowReport] = useState(false);
  const [setupMixOverride, setSetupMixOverride] = useState<QuestionMix | undefined>(undefined);

  const {
    questions,
    resumeMap,
    currentIdx,
    setCurrentIdx,
    activeRole,
    quota,
    hasResume,
    loadingQuestions,
    loadingFeedback,
    loadingAiAnswer,
    loadingReport,
    downloadingPdf,
    savingSession,
    sessionSaved,
    feedback,
    aiAnswer,
    evaluatedItems,
    reportData,
    sessions,
    loadingSessions,
    error,
    rateLimited,
    consentRequired,
    setConsentRequired,
    confirmConsentAndRetry,
    loadQuestions,
    loadBasics,
    submitAnswerForFeedback,
    requestAiAnswer,
    skipQuestion,
    insertFollowUpQuestion,
    generateFinalReport,
    downloadPdf,
    saveCurrentSession,
    fetchSessions,
    deleteSession,
    deleteAllSessions,
    resetStudio,
  } = useInterviewPrep();

  useEffect(() => {
    if (activeTab === "history") {
      fetchSessions();
    }
  }, [activeTab, fetchSessions]);

  const handleFinishSession = async () => {
    if (evaluatedItems.length === 0) {
      toast.info("Answer or skip at least one question before generating a report.");
      return;
    }
    setShowReport(true);
    await generateFinalReport();
  };

  const handleSaveSession = async () => {
    try {
      await saveCurrentSession(initialJobId);
      toast.success("Practice session and report saved to history!");
    } catch {
      toast.error("Failed to save session to history.");
    }
  };

  const handleDownloadPdf = async () => {
    try {
      await downloadPdf();
      toast.success("PDF report downloaded.");
    } catch {
      toast.error("Failed to download PDF report.");
    }
  };

  const handlePracticeWeakAreas = (mix: QuestionMix) => {
    setSetupMixOverride(mix);
    setShowReport(false);
    resetStudio();
    toast.info("Mix updated to focus on your weakest area. Click Start mock interview!");
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E6F4EA] border border-emerald-200 text-[#064E3B] text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Resume-Driven Mock Interviews</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 font-serif">
              Interview Preparation Studio
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 mt-1">
              Grounded in your redacted resume projects, with probing follow-ups, AI sample answers when stuck, and a downloadable 7-day report.
            </p>
          </div>

          {quota && (
            <div className="bg-white border border-[#E8D3AA] px-4 py-2 rounded-xl shadow-xs text-xs shrink-0">
              <span className="text-stone-500 block">AI uses today:</span>
              <strong className="text-[#064E3B] font-mono">
                {quota.used} / {quota.limit} ({quota.remaining} left)
              </strong>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 border-b border-stone-200 mb-6 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("practice")}
            className={`pb-3 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeTab === "practice"
                ? "border-[#064E3B] text-[#064E3B]"
                : "border-transparent text-stone-500 hover:text-stone-800"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Practice Studio</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={`pb-3 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeTab === "history"
                ? "border-[#064E3B] text-[#064E3B]"
                : "border-transparent text-stone-500 hover:text-stone-800"
            }`}
          >
            <History className="w-4 h-4" />
            <span>Past Sessions History</span>
          </button>
        </div>

        {error && (
          <div className="p-4 mb-6 rounded-xl bg-rose-50 text-rose-700 text-xs sm:text-sm border border-rose-200 flex flex-wrap items-center justify-between gap-3">
            <span>{error}</span>
            {rateLimited && (
              <button
                type="button"
                onClick={() => {
                  setShowReport(false);
                  loadBasics();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#064E3B] text-white text-xs font-semibold"
              >
                <BookOpen className="w-3.5 h-3.5" /> Practice 12 Basics (No Quota)
              </button>
            )}
          </div>
        )}

        {/* Tab Views */}
        {activeTab === "practice" ? (
          showReport ? (
            <FinalReportView
              role={activeRole}
              stats={
                reportData?.stats || {
                  totalQuestions: evaluatedItems.length,
                  answeredCount: evaluatedItems.filter((i) => !i.skipped && !i.usedAiAnswer).length,
                  skippedCount: evaluatedItems.filter((i) => i.skipped).length,
                  aiAssistedCount: evaluatedItems.filter((i) => i.usedAiAnswer).length,
                  averageScore: null,
                  categoryAverages: {},
                  projectAverages: {},
                  skillAverages: {},
                  strongestAreas: [],
                  weakestAreas: [],
                }
              }
              report={reportData?.report || null}
              aiAvailable={reportData?.aiAvailable ?? true}
              items={evaluatedItems}
              loadingReport={loadingReport}
              downloadingPdf={downloadingPdf}
              savingSession={savingSession}
              sessionSaved={sessionSaved}
              onDownloadPdf={handleDownloadPdf}
              onSaveSession={handleSaveSession}
              onRetryReport={() => generateFinalReport()}
              onPracticeWeakAreas={handlePracticeWeakAreas}
              onStartNew={() => {
                setShowReport(false);
                resetStudio();
              }}
            />
          ) : questions.length === 0 ? (
            <SetupPanel
              onStartCustom={(params) => loadQuestions({ ...params, jobId: initialJobId })}
              onStartBasics={loadBasics}
              loading={loadingQuestions}
              initialRole={initialRole}
              hasResume={hasResume}
              quota={quota}
              initialMix={setupMixOverride}
            />
          ) : (
            <div className="space-y-4">
              <ResumeMapCard resumeMap={resumeMap} />
              <PracticeMode
                questions={questions}
                currentIdx={currentIdx}
                onSelectIndex={setCurrentIdx}
                onSubmitAnswer={submitAnswerForFeedback}
                onRequestAiAnswer={requestAiAnswer}
                onSkipQuestion={skipQuestion}
                onAnswerFollowUp={insertFollowUpQuestion}
                feedback={feedback}
                aiAnswer={aiAnswer}
                loadingFeedback={loadingFeedback}
                loadingAiAnswer={loadingAiAnswer}
                onFinishSession={handleFinishSession}
                quota={quota}
              />
            </div>
          )
        ) : (
          <HistoryTab
            sessions={sessions}
            onDeleteSession={deleteSession}
            onDeleteAllSessions={deleteAllSessions}
            loading={loadingSessions}
          />
        )}

        <ConsentDialog
          isOpen={consentRequired}
          onConfirm={confirmConsentAndRetry}
          onCancel={() => setConsentRequired(false)}
          isLoading={loadingQuestions}
        />
      </div>
    </div>
  );
}
