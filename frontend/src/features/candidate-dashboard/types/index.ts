export interface LatestResumeScore {
  id: string;
  score: number;
  grade: string;
  date: string;
  fileName: string;
}

export interface ApplicationsByStatus {
  applied: number;
  shortlisted: number;
  rejected: number;
  hired: number;
  withdrawn: number;
}

export interface RecentApplication {
  _id: string;
  jobTitle: string;
  companyName: string;
  status: "applied" | "shortlisted" | "rejected" | "hired" | "withdrawn";
  appliedAt: string;
  matchScore: number;
  jobId?: string;
}

export interface RecommendedJob {
  _id: string;
  title: string;
  companyName: string;
  location?: { city?: string; state?: string };
  workMode: "onsite" | "remote" | "hybrid";
  jobType: "full_time" | "internship" | "part_time" | "contract";
  salary?: { min?: number; max?: number; currency?: string; isVisible?: boolean };
  skills: string[];
  isFresherFriendly: boolean;
  matchScore: number;
  createdAt: string;
}

export interface CandidateDashboardData {
  profileCompleteness: number;
  hasResume: boolean;
  latestResumeScore: LatestResumeScore | null;
  applicationsByStatus: ApplicationsByStatus;
  recentApplications: RecentApplication[];
  recommendedJobs: RecommendedJob[];
  tips: string[];
}

