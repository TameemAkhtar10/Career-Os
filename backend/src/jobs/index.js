import { run as runJobDigest } from "./jobDigest.job.js";
import { run as runRecruiterDigest } from "./recruiterDigest.job.js";
import { run as runJobAutoClose } from "./jobAutoClose.job.js";
import { run as runProfileNudge } from "./profileNudge.job.js";
import { runJobAlerts } from "./jobAlerts.job.js";

export const TASK_MAP = {
  "job-digest": runJobDigest,
  "recruiter-digest": runRecruiterDigest,
  "job-auto-close": runJobAutoClose,
  "profile-nudge": runProfileNudge,
  "job-alerts": runJobAlerts,
};

export const getJobRunner = (taskName) => {
  return TASK_MAP[taskName] || null;
};

export {
  runJobDigest,
  runRecruiterDigest,
  runJobAutoClose,
  runProfileNudge,
  runJobAlerts,
};

