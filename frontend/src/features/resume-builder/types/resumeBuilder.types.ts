export interface ResumeContact {
  email?: string;
  phone?: string;
  city?: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;
}

export interface SkillCategory {
  category: string;
  items: string[];
}

export interface ResumeEducation {
  degree: string;
  institute: string;
  startYear?: string;
  endYear?: string;
  grade?: string;
}

export interface ResumeProject {
  name: string;
  techStack: string[];
  link?: string;
  bullets: string[];
}

export interface ResumeExperience {
  role: string;
  company: string;
  startDate?: string;
  endDate?: string;
  current?: boolean;
  bullets: string[];
}

export interface ResumeCertification {
  name: string;
  issuer?: string;
  year?: string;
}

export interface ResumeDraftData {
  _id?: string;
  template: "classic" | "modern";
  fullName: string;
  headline: string;
  contact: ResumeContact;
  summary: string;
  skills: SkillCategory[];
  education: ResumeEducation[];
  projects: ResumeProject[];
  experience: ResumeExperience[];
  certifications: ResumeCertification[];
  sectionOrder: string[];
  updatedAt?: string;
}

export interface QualityCheckIssue {
  type: string;
  severity: "error" | "warning" | "tip";
  message: string;
  section?: string;
}

/**
 * Shape returned by POST /api/resume-builder/check
 * { score, grade, subScores, topIssues, pageCount }
 */
export interface QualityCheckResult {
  /** Overall score 0–100 (backend field: score) */
  score: number;
  grade: "A" | "B" | "C" | "D";
  subScores?: Record<string, number>;
  /** Up to 3 top issues (backend field: topIssues) */
  topIssues: QualityCheckIssue[];
  pageCount: number;
}
