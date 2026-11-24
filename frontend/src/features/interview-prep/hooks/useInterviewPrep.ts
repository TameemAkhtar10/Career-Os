import { useState, useCallback } from "react";
import { interviewPrepApi } from "../services/interviewPrep.api";
import {
  InterviewQuestion,
  InterviewFeedback,
  InterviewSession,
  QuotaInfo,
} from "../types/interviewPrep.types";

export function useInterviewPrep() {
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [activeRole, setActiveRole] = useState<string>("Software Engineer");
  const [quota, setQuota] = useState<QuotaInfo | null>(null);
  const [loadingQuestions, setLoadingQuestions] = useState<boolean>(false);
  const [loadingFeedback, setLoadingFeedback] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<InterviewFeedback | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [evaluatedItems, setEvaluatedItems] = useState<any[]>([]);
  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadQuestions = async (params: {
    jobId?: string;
    role?: string;
    focus?: string;
    level?: string;
  }) => {
    try {
      setLoadingQuestions(true);
      setError(null);
      setFeedback(null);
      setAnswers({});
      setEvaluatedItems([]);
      setCurrentIdx(0);

      const res = await interviewPrepApi.generateQuestions(params);
      setQuestions(res.questions);
      setActiveRole(res.role);
      setQuota(res.quota);
    } catch (err: any) {
      console.error("Failed to generate questions:", err);
      setError(err?.response?.data?.message || err?.message || "Failed to generate interview questions");
    } finally {
      setLoadingQuestions(false);
    }
  };

  const loadBasics = async () => {
    try {
      setLoadingQuestions(true);
      setError(null);
      const res = await interviewPrepApi.getBasics();
      setQuestions(res.questions);
      setActiveRole("Foundational Engineering");
      setFeedback(null);
      setCurrentIdx(0);
    } catch (err: any) {
      setError("Failed to load foundational question catalog");
    } finally {
      setLoadingQuestions(false);
    }
  };

  const submitAnswerForFeedback = async (question: InterviewQuestion, answerText: string) => {
    try {
      setLoadingFeedback(true);
      setError(null);
      const res = await interviewPrepApi.generateFeedback({
        question: question.question,
        answer: answerText,
        category: question.category,
        role: activeRole,
      });

      setFeedback(res.feedback);
      setQuota(res.quota);

      const itemRecord = {
        questionId: question.id,
        category: question.category,
        question: question.question,
        whyAsked: question.whyAsked,
        answer: answerText,
        score: res.feedback.score,
        strengths: res.feedback.strengths,
        improvements: res.feedback.improvements,
        betterStructure: res.feedback.betterStructure,
        followUpQuestion: res.feedback.followUpQuestion,
      };

      setEvaluatedItems((prev) => [...prev.filter((i) => i.questionId !== question.id), itemRecord]);
      return res.feedback;
    } catch (err: any) {
      console.error("Failed to evaluate answer:", err);
      setError(err?.response?.data?.message || err?.message || "Failed to evaluate answer");
      throw err;
    } finally {
      setLoadingFeedback(false);
    }
  };

  const saveCurrentSession = async (jobId?: string) => {
    if (evaluatedItems.length === 0) return null;
    try {
      const saved = await interviewPrepApi.saveSession({
        role: activeRole,
        jobId,
        items: evaluatedItems,
      });
      return saved;
    } catch (err: any) {
      console.error("Failed to save session:", err);
      throw err;
    }
  };

  const fetchSessions = useCallback(async () => {
    try {
      setLoadingSessions(true);
      const res = await interviewPrepApi.getSessions();
      setSessions(res);
    } catch (err) {
      console.error("Failed to load interview sessions:", err);
    } finally {
      setLoadingSessions(false);
    }
  }, []);

  const deleteSession = async (id: string) => {
    await interviewPrepApi.deleteSession(id);
    setSessions((prev) => prev.filter((s) => s._id !== id));
  };

  return {
    questions,
    currentIdx,
    setCurrentIdx,
    activeRole,
    quota,
    loadingQuestions,
    loadingFeedback,
    feedback,
    answers,
    setAnswers,
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
  };
}
