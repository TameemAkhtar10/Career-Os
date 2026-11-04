import { ApplicationStatus } from "../constants/enums";
import { Job } from "./job";

export interface StatusHistoryItem {
  status: ApplicationStatus;
  at: string;
}

export interface CandidateApplicantSummary {
  _id: string;
  name: string;
  headline: string;
  skills: string[];
  profileCompleteness: number;
}

export interface Application {
  _id: string;
  job: string | Pick<Job, "_id" | "title" | "companyName" | "location" | "workMode" | "jobType" | "status">;
  candidate: string | CandidateApplicantSummary;
  recruiter: string;
  status: ApplicationStatus;
  coverNote: string;
  matchScore: number;
  recruiterNote?: string;
  statusHistory: StatusHistoryItem[];
  createdAt: string;
  updatedAt: string;
}

export interface ApplicationsResponseData {
  applications: Application[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

