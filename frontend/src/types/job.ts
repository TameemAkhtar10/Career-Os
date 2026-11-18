import { JobStatus, JobType, WorkMode } from "../constants/enums";

export interface JobLocation {
  city: string;
  state: string;
}

export interface JobExperience {
  minYears: number;
  maxYears: number;
}

export interface JobSalary {
  min?: number | null;
  max?: number | null;
  currency?: string;
  isVisible?: boolean;
}

export interface JobRecruiterSnapshot {
  _id: string;
  name: string;
  email?: string;
}

export interface JobRecruiterProfile {
  isVerified?: boolean;
  companyLogoUrl?: string;
  companyName?: string;
}

export interface Job {
  _id: string;
  recruiter: JobRecruiterSnapshot | string;
  recruiterProfile?: JobRecruiterProfile;
  isVerified?: boolean;
  title: string;
  description: string;
  companyName: string;
  location: JobLocation;
  workMode: WorkMode;
  jobType: JobType;
  experience: JobExperience;
  salary: JobSalary;
  skills: string[];
  openings: number;
  applicationDeadline: string | null;
  status: JobStatus;
  isFresherFriendly: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface JobsResponseData {
  jobs: Job[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface JobsQueryParams {
  q?: string;
  city?: string;
  workMode?: WorkMode;
  jobType?: JobType;
  skills?: string;
  fresher?: boolean | string;
  minSalary?: number | string;
  sort?: "latest" | "salary";
  page?: number;
  limit?: number;
}

export interface SavedJobItem {
  _id: string;
  savedAt: string;
  isClosed: boolean;
  isExpired: boolean;
  isDeleted: boolean;
  job: Job | null;
}

export interface SavedJobsResponseData {
  savedJobs: SavedJobItem[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface JobAlertFilters {
  q?: string;
  skills?: string[];
  location?: string;
  workMode?: WorkMode | "";
  jobType?: JobType | "";
  fresher?: boolean;
  minSalary?: number | null;
}

export interface JobAlert {
  _id: string;
  user: string;
  name: string;
  filters: JobAlertFilters;
  frequency: "daily" | "weekly";
  active: boolean;
  lastSentAt: string | null;
  lastCheckedAt: string;
  createdAt: string;
}

export interface JobMatchData {
  matchScore: number | null;
  matchedSkills: string[];
  missingSkills: string[];
  hasResume: boolean;
  hasProfileSkills: boolean;
  tips: string[];
}

