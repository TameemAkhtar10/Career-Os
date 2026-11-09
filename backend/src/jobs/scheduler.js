import cron from "node-cron";
import { env } from "../config/env.js";
import {
  runJobDigest,
  runRecruiterDigest,
  runJobAutoClose,
  runProfileNudge,
} from "./index.js";

const scheduledTasks = [];

/**
 * Initializes internal node-cron background scheduler.
 * Enabled only when ENABLE_INTERNAL_CRON=true.
 */
export const initScheduler = () => {
  if (!env.ENABLE_INTERNAL_CRON) {
    console.log("ℹ️ Internal cron scheduler is disabled (ENABLE_INTERNAL_CRON is false).");
    return;
  }

  const timezone = env.CRON_TIMEZONE || "Asia/Kolkata";
  console.log(`⏰ Initializing internal cron scheduler [Timezone: ${timezone}]...`);

  // 1. Daily Job Digest
  if (cron.validate(env.JOB_DIGEST_CRON)) {
    const jobDigestTask = cron.schedule(
      env.JOB_DIGEST_CRON,
      async () => {
        console.log(`[cron] Triggering scheduled job-digest at ${new Date().toISOString()}...`);
        try {
          await runJobDigest({ dryRun: false });
        } catch (err) {
          console.error("[cron] Scheduled job-digest failed:", err.message);
        }
      },
      { timezone }
    );
    scheduledTasks.push({ name: "job-digest", task: jobDigestTask });
    console.log(`   ✓ job-digest scheduled: "${env.JOB_DIGEST_CRON}"`);
  } else {
    console.error(`[cron] Invalid cron expression for JOB_DIGEST_CRON: ${env.JOB_DIGEST_CRON}`);
  }

  // 2. Daily Recruiter Digest
  if (cron.validate(env.RECRUITER_DIGEST_CRON)) {
    const recruiterDigestTask = cron.schedule(
      env.RECRUITER_DIGEST_CRON,
      async () => {
        console.log(`[cron] Triggering scheduled recruiter-digest at ${new Date().toISOString()}...`);
        try {
          await runRecruiterDigest({ dryRun: false });
        } catch (err) {
          console.error("[cron] Scheduled recruiter-digest failed:", err.message);
        }
      },
      { timezone }
    );
    scheduledTasks.push({ name: "recruiter-digest", task: recruiterDigestTask });
    console.log(`   ✓ recruiter-digest scheduled: "${env.RECRUITER_DIGEST_CRON}"`);
  } else {
    console.error(`[cron] Invalid cron expression for RECRUITER_DIGEST_CRON: ${env.RECRUITER_DIGEST_CRON}`);
  }

  // 3. Job Auto-Close
  if (cron.validate(env.JOB_CLOSE_CRON)) {
    const jobAutoCloseTask = cron.schedule(
      env.JOB_CLOSE_CRON,
      async () => {
        console.log(`[cron] Triggering scheduled job-auto-close at ${new Date().toISOString()}...`);
        try {
          await runJobAutoClose({ dryRun: false });
        } catch (err) {
          console.error("[cron] Scheduled job-auto-close failed:", err.message);
        }
      },
      { timezone }
    );
    scheduledTasks.push({ name: "job-auto-close", task: jobAutoCloseTask });
    console.log(`   ✓ job-auto-close scheduled: "${env.JOB_CLOSE_CRON}"`);
  } else {
    console.error(`[cron] Invalid cron expression for JOB_CLOSE_CRON: ${env.JOB_CLOSE_CRON}`);
  }

  // 4. Weekly Profile Nudge
  if (cron.validate(env.PROFILE_NUDGE_CRON)) {
    const profileNudgeTask = cron.schedule(
      env.PROFILE_NUDGE_CRON,
      async () => {
        console.log(`[cron] Triggering scheduled profile-nudge at ${new Date().toISOString()}...`);
        try {
          await runProfileNudge({ dryRun: false });
        } catch (err) {
          console.error("[cron] Scheduled profile-nudge failed:", err.message);
        }
      },
      { timezone }
    );
    scheduledTasks.push({ name: "profile-nudge", task: profileNudgeTask });
    console.log(`   ✓ profile-nudge scheduled: "${env.PROFILE_NUDGE_CRON}"`);
  } else {
    console.error(`[cron] Invalid cron expression for PROFILE_NUDGE_CRON: ${env.PROFILE_NUDGE_CRON}`);
  }
};

/**
 * Stops all active scheduled cron tasks on graceful shutdown.
 */
export const stopScheduler = () => {
  if (scheduledTasks.length === 0) return;
  console.log(`🛑 Stopping ${scheduledTasks.length} internal cron task(s)...`);
  for (const { name, task } of scheduledTasks) {
    try {
      task.stop();
      console.log(`   ✓ Stopped task: ${name}`);
    } catch (err) {
      console.error(`   ✗ Error stopping task ${name}:`, err.message);
    }
  }
  scheduledTasks.length = 0;
};

