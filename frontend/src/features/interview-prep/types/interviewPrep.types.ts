export type QuestionCategory =
  | "project"
  | "skills"
  | "hr"
  | "scenario"
  | "followup"
  | "technical"
  | "behavioral"
  | "situational";

export type QuestionDifficulty = "easy" | "medium" | "hard";
export type QuestionSource = "profile_resume" | "role_only";

export interface QuestionMix {
  project: number;
  skills: number;
  hr: number;
}

export interface ResumeMapProject {
  name: string;
  stack: string[];
  summary: string;
}

export interface ResumeMap {
  projects: ResumeMapProject[];
  skills: string[];
}

export interface InterviewQuestion {
  id: string;
  category: QuestionCategory;
  relatedTo?: string;
  question: string;
  whyAsked: string;
  hints: string[];
  difficulty: QuestionDifficulty;
  isFollowUp?: boolean;
  parentQuestionId?: string;
}

export interface InterviewFeedback {
  score: number;
  strengths: string[];
  improvements: string[];
  betterStructure: string;
  betterAnswer?: string;
  betterAnswerUnavailable?: boolean;
  followUpQuestion?: string;
  aiAvailable?: boolean;
}

export interface AiAnswerResponse {
  betterAnswer: string;
  betterAnswerUnavailable?: boolean;
  keyPoints: string[];
  howToDeliver: string;
  followUpYouMayGet?: string;
  quota: QuotaInfo;
}

export interface InterviewSessionItem {
  questionId: string;
  category: QuestionCategory;
  relatedTo?: string;
  question: string;
  whyAsked?: string;
  answer: string;
  skipped?: boolean;
  usedAiAnswer?: boolean;
  score: number | null;
  strengths: string[];
  improvements: string[];
  betterStructure: string;
  betterAnswer?: string;
  keyPoints?: string[];
  howToDeliver?: string;
  followUpQuestion?: string;
}

export interface AreaAverage {
  average: number | null;
  answeredCount: number;
  totalCount: number;
  skippedCount: number;
  aiAssistedCount: number;
}

export interface ReportStats {
  totalQuestions: number;
  answeredCount: number;
  skippedCount: number;
  aiAssistedCount: number;
  averageScore: number | null;
  categoryAverages: Record<string, AreaAverage>;
  projectAverages: Record<string, AreaAverage>;
  skillAverages: Record<string, AreaAverage>;
  strongestAreas: string[];
  weakestAreas: string[];
}

export interface ReportWeakArea {
  area: string;
  relatedTo?: string;
  whyItMatters: string;
  fix: string;
}

export interface ProjectReadinessItem {
  project: string;
  score: number | null;
  note: string;
}

export interface TopicToStudyItem {
  topic: string;
  reason: string;
  practice: string;
}

export interface FinalReport {
  headline: string;
  summary: string;
  strengths: string[];
  weakAreas: ReportWeakArea[];
  answerHabits: string[];
  projectReadiness: ProjectReadinessItem[];
  topicsToStudy: TopicToStudyItem[];
  nextSteps: string[];
}

export interface GenerateReportResponse {
  role: string;
  stats: ReportStats;
  report: FinalReport | null;
  aiAvailable: boolean;
  quota: QuotaInfo;
}

export interface InterviewSession {
  _id: string;
  user: string;
  job?: string | null;
  role: string;
  level: "fresher" | "junior" | "mid";
  focus: "technical" | "hr" | "mixed";
  items: InterviewSessionItem[];
  stats?: ReportStats | null;
  report?: FinalReport | null;
  resumeMap?: ResumeMap | null;
  createdAt: string;
  updatedAt: string;
}

export interface QuotaInfo {
  used: number;
  limit: number;
  remaining: number;
}

export interface UsageInfo extends QuotaInfo {
  hasResume: boolean;
}

export interface GenerateQuestionsResponse {
  role: string;
  focus: string;
  level: string;
  source: QuestionSource;
  aiAvailable: boolean;
  resumeMap: ResumeMap;
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
