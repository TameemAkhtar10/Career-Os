export interface AdminStats {
  users: {
    total: number;
    candidates: number;
    recruiters: number;
    admins: number;
    signupsLast7Days: number;
  };
  jobs: {
    total: number;
    open: number;
    closed: number;
    draft: number;
  };
  applications: {
    total: number;
    applied: number;
    shortlisted: number;
    rejected: number;
    hired: number;
    withdrawn: number;
  };
}

export interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: string;
  status: "active" | "suspended";
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminJob {
  _id: string;
  title: string;
  companyName: string;
  status: string;
  applicantCount: number;
  createdAt: string;
  recruiter?: { _id: string; name: string; email: string };
}

export interface AuditLog {
  _id: string;
  action: string;
  targetType: string;
  targetId: string;
  meta?: Record<string, unknown>;
  createdAt: string;
  admin?: { _id: string; name: string; email: string };
}

export interface AdminUsersResponse {
  users: AdminUser[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AdminJobsResponse {
  jobs: AdminJob[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AdminAuditLogsResponse {
  auditLogs: AuditLog[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

