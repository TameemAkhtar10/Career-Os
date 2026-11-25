import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { interviewPrepApi } from "../services/interviewPrep.api";
import {
  InterviewQuestion,
  InterviewFeedback,
  AiAnswerResponse,
  InterviewSessionItem,
  QuotaInfo,
  ResumeMap,
  ReportStats,
  FinalReport,
  QuestionSource,
  QuestionMix,
} from "../types/interviewPrep.types";

const extractErrorInfo = (err: any) => {
  const status = err?.status || err?.response?.status;
  const message =
    err?.response?.data?.message || err?.message || "Something went wrong. Please try again.";
  return { status, message };
};

export function useInterviewPrep() {
  const queryClient = useQueryClient();

  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [resumeMap, setResumeMap] = useState<ResumeMap | null>(null);
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [activeRole, setActiveRole] = useState<string>("Software Engineer");
  const [activeLevel, setActiveLevel] = useState<"fresher" | "junior" | "mid">("fresher");
  const [activeFocus, setActiveFocus] = useState<"technical" | "hr" | "mixed">("mixed");
  const [activeJobId, setActiveJobId] = useState<string | undefined>(undefined);
  const [quotaOverride, setQuotaOverride] = useState<QuotaInfo | null>(null);
  const [feedback, setFeedback] = useState<InterviewFeedback | null>(null);
  const [aiAnswer, setAiAnswer] = useState<AiAnswerResponse | null>(null);
  const [evaluatedItems, setEvaluatedItems] = useState<InterviewSessionItem[]>([]);
  const [reportData, setReportData] = useState<{
    stats: ReportStats;
    report: FinalReport | null;
    aiAvailable: boolean;
  } | null>(null);
  const [sessionSaved, setSessionSaved] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [rateLimited, setRateLimited] = useState<boolean>(false);
  const [consentRequired, setConsentRequired] = useState<boolean>(false);
  const [pendingStartParams, setPendingStartParams] = useState<any>(null);

  const usageQuery = useQuery({
    queryKey: ["interviewPrep", "usage"],
    queryFn: () => interviewPrepApi.getUsage(),
    staleTime: 30_000,
  });

  const sessionsQuery = useQuery({
    queryKey: ["interviewPrep", "sessions"],
    queryFn: () => interviewPrepApi.getSessions(),
  });

  const quota: QuotaInfo | null =
    quotaOverride ??
    (usageQuery.data
      ? {
          used: usageQuery.data.used,
          limit: usageQuery.data.limit,
          remaining: usageQuery.data.remaining,
        }
      : null);

  const updateQuota = (nextQuota?: QuotaInfo) => {
    if (nextQuota) {
      setQuotaOverride(nextQuota);
      queryClient.setQueryData(["interviewPrep", "usage"], (prev: any) =>
        prev ? { ...prev, ...nextQuota } : prev
      );
    }
  };

  const generateQuestionsMutation = useMutation({
    mutationFn: (params: {
      jobId?: string;
      role?: string;
      focus?: string;
      level?: string;
      source?: QuestionSource;
      mix?: QuestionMix;
      consent?: boolean;
    }) => interviewPrepApi.generateQuestions(params),
  });

  const loadQuestions = async (params: {
    jobId?: string;
    role?: string;
    focus?: string;
    level?: string;
    source?: QuestionSource;
    mix?: QuestionMix;
    consent?: boolean;
  }) => {
    try {
      setError(null);
      setRateLimited(false);
      setFeedback(null);
      setAiAnswer(null);
      setEvaluatedItems([]);
      setReportData(null);
      setSessionSaved(false);
      setCurrentIdx(0);

      const res = await generateQuestionsMutation.mutateAsync(params);
      setQuestions(res.questions);
      setResumeMap(res.resumeMap || null);
      setActiveRole(res.role);
      setActiveLevel((res.level as "fresher" | "junior" | "mid") || "fresher");
      setActiveFocus((res.focus as "technical" | "hr" | "mixed") || "mixed");
      setActiveJobId(params.jobId);
      setConsentRequired(false);
      setPendingStartParams(null);
      updateQuota(res.quota);

      if (res.aiAvailable === false) {
        setError("AI questions could not be strictly grounded in your resume; loaded foundational questions instead.");
      }
      return res;
    } catch (err: any) {
      const { status, message } = extractErrorInfo(err);
      if (status === 403 && /consent/i.test(message)) {
        setPendingStartParams(params);
        setConsentRequired(true);
        return null;
      }
      if (status === 429) {
        setRateLimited(true);
      }
      setError(message);
      return null;
    }
  };

  const confirmConsentAndRetry = async () => {
    if (!pendingStartParams) {
      setConsentRequired(false);
      return;
    }
    await loadQuestions({ ...pendingStartParams, consent: true });
  };

  const loadBasicsMutation = useMutation({
    mutationFn: () => interviewPrepApi.getBasics(),
  });

  const loadBasics = async () => {
    try {
      setError(null);
      setRateLimited(false);
      const res = await loadBasicsMutation.mutateAsync();
      setQuestions(res.questions);
      setResumeMap(null);
      setActiveRole("Foundational Engineering");
      setFeedback(null);
      setAiAnswer(null);
      setEvaluatedItems([]);
      setReportData(null);
      setSessionSaved(false);
      setCurrentIdx(0);
    } catch {
      setError("Failed to load foundational question catalog.");
    }
  };

  const feedbackMutation = useMutation({
    mutationFn: (payload: Parameters<typeof interviewPrepApi.generateFeedback>[0]) =>
      interviewPrepApi.generateFeedback(payload),
  });

  const submitAnswerForFeedback = async (question: InterviewQuestion, answerText: string) => {
    try {
      setError(null);
      setRateLimited(false);
      setAiAnswer(null);

      const res = await feedbackMutation.mutateAsync({
        question: question.question,
        answer: answerText,
        category: question.category,
        role: activeRole,
        questionContext: {
          category: question.category,
          relatedTo: question.relatedTo,
        },
        askFollowUp: !question.isFollowUp,
        resumeMap,
      });

      setFeedback(res.feedback);
      updateQuota(res.quota);

      const itemRecord: InterviewSessionItem = {
        questionId: question.id,
        category: question.category,
        relatedTo: question.relatedTo,
        question: question.question,
        whyAsked: question.whyAsked,
        answer: answerText,
        skipped: false,
        usedAiAnswer: false,
        score: res.feedback.score,
        strengths: res.feedback.strengths,
        improvements: res.feedback.improvements,
        betterStructure: res.feedback.betterStructure,
        betterAnswer: res.feedback.betterAnswer,
        followUpQuestion: res.feedback.followUpQuestion,
      };

      setEvaluatedItems((prev) => [...prev.filter((i) => i.questionId !== question.id), itemRecord]);
      return res.feedback;
    } catch (err: any) {
      const { status, message } = extractErrorInfo(err);
      if (status === 429) setRateLimited(true);
      setError(message);
      throw err;
    }
  };

  const aiAnswerMutation = useMutation({
    mutationFn: (payload: Parameters<typeof interviewPrepApi.generateAiAnswer>[0]) =>
      interviewPrepApi.generateAiAnswer(payload),
  });

  const requestAiAnswer = async (question: InterviewQuestion) => {
    try {
      setError(null);
      setRateLimited(false);
      setFeedback(null);

      const res = await aiAnswerMutation.mutateAsync({
        question: question.question,
        questionContext: {
          category: question.category,
          relatedTo: question.relatedTo,
        },
        resumeMap,
        jobId: activeJobId,
        role: activeRole,
        mode: "idk",
      });

      setAiAnswer(res);
      updateQuota(res.quota);

      const itemRecord: InterviewSessionItem = {
        questionId: question.id,
        category: question.category,
        relatedTo: question.relatedTo,
        question: question.question,
        whyAsked: question.whyAsked,
        answer: "[Used AI Sample Answer]",
        skipped: false,
        usedAiAnswer: true,
        score: null,
        strengths: [],
        improvements: ["Reviewed AI-generated sample answer. Practice explaining this in your own words."],
        betterStructure: "",
        betterAnswer: res.betterAnswer,
        keyPoints: res.keyPoints,
        howToDeliver: res.howToDeliver,
        followUpQuestion: res.followUpYouMayGet,
      };

      setEvaluatedItems((prev) => [...prev.filter((i) => i.questionId !== question.id), itemRecord]);
      return res;
    } catch (err: any) {
      const { status, message } = extractErrorInfo(err);
      if (status === 429) setRateLimited(true);
      setError(message);
      throw err;
    }
  };

  const skipQuestion = (question: InterviewQuestion) => {
    const itemRecord: InterviewSessionItem = {
      questionId: question.id,
      category: question.category,
      relatedTo: question.relatedTo,
      question: question.question,
      whyAsked: question.whyAsked,
      answer: "",
      skipped: true,
      usedAiAnswer: false,
      score: null,
      strengths: [],
      improvements: [],
      betterStructure: "",
    };

    setEvaluatedItems((prev) => [...prev.filter((i) => i.questionId !== question.id), itemRecord]);
    setFeedback(null);
    setAiAnswer(null);
  };

  /**
   * Inserts a follow-up question right after the current question (max 1 per main question).
   */
  const insertFollowUpQuestion = (parentQuestion: InterviewQuestion, followUpText: string) => {
    if (!followUpText || parentQuestion.isFollowUp) return;
    const followUpId = `${parentQuestion.id}_followup`;
    const alreadyExists = questions.some((q) => q.id === followUpId);
    if (alreadyExists) {
      const existingIdx = questions.findIndex((q) => q.id === followUpId);
      setCurrentIdx(existingIdx);
      setFeedback(null);
      setAiAnswer(null);
      return;
    }

    const followUpQ: InterviewQuestion = {
      id: followUpId,
      category: "followup",
      relatedTo: parentQuestion.relatedTo,
      question: followUpText,
      whyAsked: "Probing follow-up based on your previous answer.",
      hints: ["Address the specific detail asked directly", "Keep your explanation concise and honest"],
      difficulty: parentQuestion.difficulty,
      isFollowUp: true,
      parentQuestionId: parentQuestion.id,
    };

    const nextQuestions = [...questions];
    nextQuestions.splice(currentIdx + 1, 0, followUpQ);
    setQuestions(nextQuestions);
    setCurrentIdx(currentIdx + 1);
    setFeedback(null);
    setAiAnswer(null);
  };

  const reportMutation = useMutation({
    mutationFn: (payload: Parameters<typeof interviewPrepApi.generateReport>[0]) =>
      interviewPrepApi.generateReport(payload),
  });

  const generateFinalReport = async (itemsOverride?: InterviewSessionItem[]) => {
    const sourceItems = itemsOverride ?? evaluatedItems;
    if (sourceItems.length === 0) return null;

    try {
      setError(null);
      setRateLimited(false);
      const res = await reportMutation.mutateAsync({
        items: sourceItems.slice(0, 12).map((i) => ({
          question: i.question,
          category: i.category,
          relatedTo: i.relatedTo,
          answer: (i.answer || "").slice(0, 2000),
          score: i.score,
          skipped: Boolean(i.skipped),
          usedAiAnswer: Boolean(i.usedAiAnswer),
        })),
        jobId: activeJobId,
        role: activeRole,
      });

      setReportData({
        stats: res.stats,
        report: res.report,
        aiAvailable: res.aiAvailable,
      });
      updateQuota(res.quota);
      return res;
    } catch (err: any) {
      const { status, message } = extractErrorInfo(err);
      if (status === 429) setRateLimited(true);
      setError(message);
      return null;
    }
  };

  const pdfMutation = useMutation({
    mutationFn: () =>
      interviewPrepApi.downloadReportPdf({
        report: reportData?.report || null,
        stats: reportData?.stats || ({} as ReportStats),
        items: evaluatedItems,
        role: activeRole,
      }),
  });

  const downloadPdf = async () => {
    const blob = await pdfMutation.mutateAsync();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "career-os-interview-report.pdf";
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  const saveSessionMutation = useMutation({
    mutationFn: (payload: Parameters<typeof interviewPrepApi.saveSession>[0]) =>
      interviewPrepApi.saveSession(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["interviewPrep", "sessions"] });
      setSessionSaved(true);
    },
  });

  const saveCurrentSession = async (jobId?: string) => {
    if (evaluatedItems.length === 0) return null;
    const saved = await saveSessionMutation.mutateAsync({
      role: activeRole,
      level: activeLevel,
      focus: activeFocus,
      jobId: jobId || activeJobId,
      items: evaluatedItems,
      stats: reportData?.stats || null,
      report: reportData?.report || null,
      resumeMap,
    });
    return saved;
  };

  const deleteSessionMutation = useMutation({
    mutationFn: (id: string) => interviewPrepApi.deleteSession(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["interviewPrep", "sessions"] });
    },
  });

  const deleteAllSessionsMutation = useMutation({
    mutationFn: () => interviewPrepApi.deleteAllSessions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["interviewPrep", "sessions"] });
    },
  });

  const fetchSessions = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ["interviewPrep", "sessions"] });
  }, [queryClient]);

  const resetStudio = () => {
    setQuestions([]);
    setResumeMap(null);
    setEvaluatedItems([]);
    setFeedback(null);
    setAiAnswer(null);
    setReportData(null);
    setSessionSaved(false);
    setCurrentIdx(0);
    setError(null);
  };

  return {
    questions,
    resumeMap,
    currentIdx,
    setCurrentIdx: (idx: number) => {
      setCurrentIdx(idx);
      setFeedback(null);
      setAiAnswer(null);
    },
    activeRole,
    activeLevel,
    activeFocus,
    quota,
    hasResume: usageQuery.data?.hasResume ?? true,
    loadingQuestions: generateQuestionsMutation.isPending || loadBasicsMutation.isPending,
    loadingFeedback: feedbackMutation.isPending,
    loadingAiAnswer: aiAnswerMutation.isPending,
    loadingReport: reportMutation.isPending,
    downloadingPdf: pdfMutation.isPending,
    savingSession: saveSessionMutation.isPending,
    sessionSaved,
    feedback,
    aiAnswer,
    evaluatedItems,
    reportData,
    sessions: sessionsQuery.data ?? [],
    loadingSessions: sessionsQuery.isLoading,
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
    deleteSession: (id: string) => deleteSessionMutation.mutateAsync(id),
    deleteAllSessions: () => deleteAllSessionsMutation.mutateAsync(),
    resetStudio,
  };
}
