import { apiClient } from "@/config/api";
import {
  InterviewSession,
  GenerateQuestionsResponse,
  GenerateFeedbackResponse,
  AiAnswerResponse,
  GenerateReportResponse,
  BasicsResponse,
  UsageInfo,
  QuestionSource,
  QuestionMix,
  ResumeMap,
  ReportStats,
  FinalReport,
  InterviewSessionItem,
} from "../types/interviewPrep.types";

export const interviewPrepApi = {
  getBasics: async (): Promise<BasicsResponse> => {
    const res = await apiClient<BasicsResponse>("/api/interview-prep/basics", { method: "GET" });
    return res.data;
  },

  getUsage: async (): Promise<UsageInfo> => {
    const res = await apiClient<UsageInfo>("/api/interview-prep/usage", { method: "GET" });
    return res.data;
  },

  generateQuestions: async (data: {
    jobId?: string;
    role?: string;
    focus?: string;
    level?: string;
    source?: QuestionSource;
    mix?: QuestionMix;
    consent?: boolean;
  }): Promise<GenerateQuestionsResponse> => {
    const res = await apiClient<GenerateQuestionsResponse>("/api/interview-prep/questions", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return res.data;
  },

  generateFeedback: async (data: {
    question: string;
    answer: string;
    category?: string;
    role?: string;
    questionContext?: { category?: string; relatedTo?: string };
    askFollowUp?: boolean;
    resumeMap?: ResumeMap | null;
    consent?: boolean;
  }): Promise<GenerateFeedbackResponse> => {
    const res = await apiClient<GenerateFeedbackResponse>("/api/interview-prep/feedback", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return res.data;
  },

  generateAiAnswer: async (data: {
    question: string;
    questionContext?: { category?: string; relatedTo?: string };
    resumeMap?: ResumeMap | null;
    jobId?: string;
    role?: string;
    mode?: "idk";
    consent?: boolean;
  }): Promise<AiAnswerResponse> => {
    const res = await apiClient<AiAnswerResponse>("/api/interview-prep/ai-answer", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return res.data;
  },

  generateReport: async (data: {
    items: Array<{
      question: string;
      category: string;
      relatedTo?: string;
      answer: string;
      score: number | null;
      skipped: boolean;
      usedAiAnswer: boolean;
    }>;
    jobId?: string;
    role?: string;
    consent?: boolean;
  }): Promise<GenerateReportResponse> => {
    const res = await apiClient<GenerateReportResponse>("/api/interview-prep/report", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return res.data;
  },

 downloadReportPdf: async (data: {
  report: FinalReport | null;
  stats: ReportStats;
  items: InterviewSessionItem[];
  role: string;
  date?: string;
}): Promise<Blob> => {
  const response = await apiClient<Blob>(
    "/api/interview-prep/report/pdf",
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );

  return response.data as Blob;
},
  saveSession: async (data: {
    role: string;
    level?: string;
    focus?: string;
    jobId?: string;
    items: InterviewSessionItem[];
    stats?: ReportStats | null;
    report?: FinalReport | null;
    resumeMap?: ResumeMap | null;
  }): Promise<InterviewSession> => {
    const res = await apiClient<InterviewSession>("/api/interview-prep/sessions", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return res.data;
  },

  getSessions: async (): Promise<InterviewSession[]> => {
    const res = await apiClient<InterviewSession[]>("/api/interview-prep/sessions", { method: "GET" });
    return res.data;
  },

  deleteSession: async (id: string): Promise<void> => {
    await apiClient<void>(`/api/interview-prep/sessions/${id}`, { method: "DELETE" });
  },

  deleteAllSessions: async (): Promise<void> => {
    await apiClient<void>("/api/interview-prep/sessions", { method: "DELETE" });
  },
};
