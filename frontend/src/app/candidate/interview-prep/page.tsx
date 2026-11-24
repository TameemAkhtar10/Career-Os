"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useInterviewPrep } from "@/features/interview-prep/hooks/useInterviewPrep";
import { SetupPanel } from "@/features/interview-prep/components/SetupPanel";
import { PracticeMode } from "@/features/interview-prep/components/PracticeMode";
import { HistoryTab } from "@/features/interview-prep/components/HistoryTab";
import { Sparkles, History, BookOpen, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function CandidateInterviewPrepPage() {
  const searchParams = useSearchParams();
  const initialJobId = searchParams.get("jobId") || undefined;
  const initialRole = searchParams.get("role") || "";

  const [activeTab, setActiveTab] = useState<"practice" | "history">("practice");
  const [sessionFinished, setSessionFinished] = useState(false);

  const {
    questions,
    currentIdx,
    setCurrentIdx,
    activeRole,
    quota,
    loadingQuestions,
    loadingFeedback,
    feedback,
    evaluatedItems,
    sessions,
    loadingSessions,
    error,
    loadQuestions,
    loadBasics,
    submitAnswerForFeedback,
    saveCurrentSession,
    fetchSessions,
    deleteSession,
  } = useInterviewPrep();

  useEffect(() => {
    if (activeTab === "history") {
      fetchSessions();
    }
  }, [activeTab, fetchSessions]);

  const handleFinish = async () => {
    try {
      if (evaluatedItems.length > 0) {
        await saveCurrentSession(initialJobId);
        toast.success("Practice session and feedback saved to history!");
      }
      setSessionFinished(true);
    } catch {
      toast.error("Failed to save session to history");
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E6F4EA] border border-emerald-200 text-[#064E3B] text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Realistic Indian Tech Interviews</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 font-serif">
              Interview Preparation &amp; Feedback
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 mt-1">
              Practice role-tailored interview rounds with immediate feedback, STAR structure blueprints, and zero hallucinated metrics.
            </p>
          </div>

          {quota && (
            <div className="bg-white border border-[#E8D3AA] px-4 py-2 rounded-xl shadow-xs text-xs">
              <span className="text-stone-500 block">Daily AI Practice Rounds:</span>
              <strong className="text-[#064E3B] font-mono">
                {quota.remaining} of {quota.limit} remaining
              </strong>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 border-b border-stone-200 mb-6">
          <button
            onClick={() => {
              setActiveTab("practice");
              setSessionFinished(false);
            }}
            className={`pb-3 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === "practice"
                ? "border-[#064E3B] text-[#064E3B]"
                : "border-transparent text-stone-500 hover:text-stone-800"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Practice Studio</span>
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`pb-3 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
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
          <div className="p-4 mb-6 rounded-xl bg-rose-50 text-rose-700 text-xs sm:text-sm border border-rose-200">
            {error}
          </div>
        )}

        {/* Tab Views */}
        {activeTab === "practice" ? (
          sessionFinished ? (
            <div className="bg-white border border-[#E8D3AA] rounded-2xl p-10 text-center space-y-4 max-w-lg mx-auto shadow-xs">
              <CheckCircle className="w-12 h-12 text-[#064E3B] mx-auto" />
              <h3 className="text-xl font-bold font-serif text-stone-900">
                Session Completed &amp; Saved!
              </h3>
              <p className="text-xs text-stone-600">
                You evaluated {evaluatedItems.length} question(s). You can review all your answers, scores, and feedback in the History tab anytime.
              </p>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => setSessionFinished(false)}
                  className="px-5 py-2.5 bg-[#064E3B] text-white text-xs font-semibold rounded-lg hover:bg-[#032E23]"
                >
                  Start Another Practice
                </button>
                <button
                  onClick={() => setActiveTab("history")}
                  className="px-4 py-2 border border-stone-200 text-stone-700 text-xs font-semibold rounded-lg hover:bg-stone-50"
                >
                  View History
                </button>
              </div>
            </div>
          ) : questions.length === 0 ? (
            <SetupPanel
              onStartCustom={(params) => loadQuestions({ ...params, jobId: initialJobId })}
              onStartBasics={loadBasics}
              loading={loadingQuestions}
              initialRole={initialRole}
            />
          ) : (
            <PracticeMode
              questions={questions}
              currentIdx={currentIdx}
              onSelectIndex={setCurrentIdx}
              onSubmitAnswer={submitAnswerForFeedback}
              feedback={feedback}
              loadingFeedback={loadingFeedback}
              onFinishSession={handleFinish}
            />
          )
        ) : (
          <HistoryTab
            sessions={sessions}
            onDeleteSession={deleteSession}
            loading={loadingSessions}
          />
        )}
      </div>
    </div>
  );
}
