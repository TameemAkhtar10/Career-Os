export type Role = "candidate" | "recruiter" | "admin";

export type WorkMode = "onsite" | "remote" | "hybrid";

export type JobType = "full_time" | "internship" | "part_time" | "contract";

export type JobStatus = "draft" | "open" | "closed";

export type ApplicationStatus =
  | "applied"
  | "shortlisted"
  | "rejected"
  | "hired"
  | "withdrawn";

export const ROLE_LABELS: Record<Role, string> = {
  candidate: "Candidate",
  recruiter: "Recruiter",
  admin: "Administrator",
};

export const WORK_MODE_LABELS: Record<WorkMode, string> = {
  onsite: "Onsite",
  remote: "Remote",
  hybrid: "Hybrid",
};

export const JOB_TYPE_LABELS: Record<JobType, string> = {
  full_time: "Full Time",
  internship: "Internship",
  part_time: "Part Time",
  contract: "Contract",
};

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  draft: "Draft",
  open: "Open",
  closed: "Closed",
};

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  applied: "Applied",
  shortlisted: "Shortlisted",
  rejected: "Rejected",
  hired: "Hired",
  withdrawn: "Withdrawn",
};

