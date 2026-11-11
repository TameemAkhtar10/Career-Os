export interface SubScores {
  atsCompatibility: number;
  impactAchievements: number;
  skillsValidation: number;
  projectQuality: number;
  writingQuality: number;
  professionalism: number;
}

export type SubScoreReasons = Record<keyof SubScores, string[]>;

export interface Stats {
  parseRate: number;
  recruiterMatch: number | null;
  experience: string;
  wordCount: number;
  approxPages: number;
}

export interface Issue {
  severity: "high" | "medium" | "low";
  title: string;
  detail: string;
  fix: string;
}

export interface QuickInsight {
  tone: "good" | "warn" | "bad";
  title: string;
  detail: string;
}

export interface Suggestion {
  priority: "high" | "medium" | "low";
  title: string;
  description: string;
  example: string;
}

export interface BulletRewrite {
  original: string;
  improved: string;
  reason: string;
  metricHint?: string;
}

export interface Keywords {
  present: string[];
  missing: string[];
}

export interface AiFeedback {
  summary: string;
  strengths: string[];
  improvements: string[];
  suggestions: Suggestion[];
  bulletRewrites: BulletRewrite[];
}

export interface ResumeTarget {
  type: "none" | "job" | "description";
  jobId?: string | null;
  jobTitle?: string;
  targetHash?: string;
}

export interface ResumeAnalysis {
  _id: string;
  user: string;
  contentHash: string;
  cacheKey: string;
  target: ResumeTarget;
  fileName: string;
  score: number;
  grade: string;
  subScores: SubScores;
  subScoreReasons?: Partial<SubScoreReasons>;
  stats: Stats;
  quickInsights: QuickInsight[];
  issues: Issue[];
  keywords: Keywords;
  ai: AiFeedback;
  aiAvailable: boolean;
  provider: string;
  createdAt: string;
  cached?: boolean;
}

export interface ResumeAnalysisSummary {
  _id: string;
  fileName: string;
  target: ResumeTarget;
  score: number;
  grade: string;
  createdAt: string;
}

export interface AnalyzeResumeRequest {
  jobId?: string;
  jobDescription?: string;
  consent?: boolean;
}

