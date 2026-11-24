export type TrackerStage =
  | "saved"
  | "applied"
  | "screening"
  | "interview"
  | "offer"
  | "rejected"
  | "withdrawn";

export type TrackerSource = "platform" | "external";

export interface StageHistoryItem {
  stage: TrackerStage;
  at: string;
}

export interface TrackerEntry {
  _id: string;
  user: string;
  source: TrackerSource;
  application?: string | null;
  job?: string | null;
  jobTitle: string;
  company: string;
  location?: string;
  link?: string;
  stage: TrackerStage;
  appliedOn?: string | null;
  notes?: string;
  followUpAt?: string | null;
  interviewAt?: string | null;
  salaryNote?: string;
  stageHistory: StageHistoryItem[];
  remindersEnabled: boolean;
  lastReminderSentAt?: string | null;
  hidden?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TrackerCounts {
  all: number;
  saved: number;
  applied: number;
  screening: number;
  interview: number;
  offer: number;
  rejected: number;
  withdrawn: number;
}

export interface TrackerPagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface TrackerResponse {
  entries: TrackerEntry[];
  counts: TrackerCounts;
  pagination: TrackerPagination;
}

export interface TrackerSummaryResponse {
  counts: TrackerCounts;
  upcomingFollowUps: TrackerEntry[];
  upcomingInterviews: TrackerEntry[];
  idleApplications: TrackerEntry[];
}

export interface CreateTrackerEntryInput {
  jobTitle: string;
  company: string;
  location?: string;
  link?: string;
  stage?: TrackerStage;
  appliedOn?: string | null;
  notes?: string;
  followUpAt?: string | null;
  interviewAt?: string | null;
  salaryNote?: string;
  remindersEnabled?: boolean;
}

export interface UpdateTrackerEntryInput {
  jobTitle?: string;
  company?: string;
  location?: string;
  link?: string;
  stage?: TrackerStage;
  appliedOn?: string | null;
  notes?: string;
  followUpAt?: string | null;
  interviewAt?: string | null;
  salaryNote?: string;
  remindersEnabled?: boolean;
  hidden?: boolean;
}
