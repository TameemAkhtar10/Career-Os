export const ROUTES = {
  HOME: "/",
  JOBS: "/jobs",
  JOB_DETAIL: (id: string) => `/jobs/${id}`,
  LOGIN: "/login",
  REGISTER: "/register",
  VERIFY_EMAIL: "/verify-email",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password",
  CANDIDATE: {
    APPLICATIONS: "/candidate/applications",
    PROFILE: "/candidate/profile",
  },
  RECRUITER: {
    DASHBOARD: "/recruiter/dashboard",
    COMPANY: "/recruiter/company",
    NEW_JOB: "/recruiter/jobs/new",
    EDIT_JOB: (id: string) => `/recruiter/jobs/${id}/edit`,
    APPLICANTS: (id: string) => `/recruiter/jobs/${id}/applicants`,
  },
  SYSTEM: {
    FORBIDDEN: "/403",
    OFFLINE: "/offline",
    SESSION_EXPIRED: "/session-expired",
  },
} as const;

