export type QuestionCategory = "technical" | "behavioral" | "situational" | "hr";
export type QuestionDifficulty = "easy" | "medium" | "hard";

export interface InterviewQuestion {
  id: string;
  category: QuestionCategory;
  question: string;
  whyAsked: string;
  hints: string[];
  difficulty: QuestionDifficulty;
}

export interface InterviewFeedback {
  score: number;
  strengths: string[];
  improvements: string[];
  betterStructure: string;
  followUpQuestion?: string;
  aiAvailable?: boolean;
}

export interface InterviewSessionItem {
  questionId: string;
  category: QuestionCategory;
  question: string;
  whyAsked?: string;
  answer: string;
  score: number;
  strengths: string[];
  improvements: string[];
  betterStructure: string;
  followUpQuestion?: string;
}

export interface InterviewSession {
  _id: string;
  user: string;
  job?: string | null;
  role: string;
  level: "fresher" | "junior" | "mid";
  focus: "technical" | "hr" | "mixed";
  items: InterviewSessionItem[];
  createdAt: string;
  updatedAt: string;
}

export interface QuotaInfo {
  used: number;
  limit: number;
  remaining: number;
}

export interface GenerateQuestionsResponse {
  role: string;
  focus: string;
  level: string;
  questions: InterviewQuestion[];
  quota: QuotaInfo;
}

export interface GenerateFeedbackResponse {
  feedback: InterviewFeedback;
  quota: QuotaInfo;
}

export interface BasicsResponse {
  questions: InterviewQuestion[];
  total: number;
}
