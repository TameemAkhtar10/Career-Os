import { apiClient } from "@/config/api";
import {
  InterviewQuestion,
  InterviewFeedback,
  InterviewSession,
  GenerateQuestionsResponse,
  GenerateFeedbackResponse,
  BasicsResponse,
} from "../types/interviewPrep.types";

export const interviewPrepApi = {
  getBasics: async (): Promise<BasicsResponse> => {
    const res = await apiClient<BasicsResponse>("/api/interview-prep/basics", { method: "GET" });
    return res.data;
  },

  generateQuestions: async (data: {
    jobId?: string;
    role?: string;
    focus?: string;
    level?: string;
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
  }): Promise<GenerateFeedbackResponse> => {
    const res = await apiClient<GenerateFeedbackResponse>("/api/interview-prep/feedback", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return res.data;
  },

  saveSession: async (data: {
    role: string;
    level?: string;
    focus?: string;
    jobId?: string;
    items: any[];
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
};
