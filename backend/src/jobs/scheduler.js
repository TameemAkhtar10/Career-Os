import cron from "node-cron";
import { env } from "../config/env.js";
import {
  runJobDigest,
  runRecruiterDigest,
  runJobAutoClose,
  runProfileNudge,
  runJobAlerts,
} from "./index.js";
import { CronJobLock } from "../models/cronJobLock.model.js";
import {
  getPeriodKey,
  checkDueWithinLast6Hours,
  computeNextRun,
  withTimeout,
  formatIstDateTime,
} from "./cronUtils.js";

/**
 * Registry of all 5 internal production cron jobs.
 * All configured with Asia/Kolkata timezone (IST = UTC+05:30).
 */
export const REGISTERED_JOBS = [
  {
    name: "job-auto-close",
    schedule: env.JOB_CLOSE_CRON || "30 0 * * *", // 00:30 daily
    timezone: env.CRON_TIMEZONE || "Asia/Kolkata",
    type: "daily",
    runner: runJobAutoClose,
  },
  {
    name: "job-digest",
    schedule: env.JOB_DIGEST_CRON || "0 9 * * *", // 09:00 daily
    timezone: env.CRON_TIMEZONE || "Asia/Kolkata",
    type: "daily",
    runner: runJobDigest,
  },
  {
    name: "profile-nudge",
    schedule: env.PROFILE_NUDGE_CRON || "0 11 * * 1", // Monday 11:00
    timezone: env.CRON_TIMEZONE || "Asia/Kolkata",
    type: "weekly",
    runner: runProfileNudge,
  },
  {
    name: "recruiter-digest",
    schedule: env.RECRUITER_DIGEST_CRON || "0 18 * * *", // 18:00 daily
    timezone: env.CRON_TIMEZONE || "Asia/Kolkata",
    type: "daily",
    runner: runRecruiterDigest,
  },
  {
    name: "job-alerts",
    schedule: env.JOB_ALERTS_CRON || "0 * * * *", // at minute 0 of every hour
    timezone: env.CRON_TIMEZONE || "Asia/Kolkata",
    type: "hourly",
    runner: runJobAlerts,
  },
];

// In-memory tracking of active tasks and running jobs
const scheduledTasks = [];
export const activeRuns = new Set();

// 25 minutes timeout guard
const JOB_TIMEOUT_MS = 25 * 60 * 1000;

/**
 * Ensures initial documents exist in CronJobLock collection for all registered jobs.
 */
export const ensureJobLockRecords = async () => {
  for (const job of REGISTERED_JOBS) {
    try {
      await CronJobLock.updateOne(
        { name: job.name },
        {
          $setOnInsert: {
            name: job.name,
            schedule: job.schedule,
            timezone: job.timezone,
            lockedAt: null,
            lockedBy: null,
            running: false,
            lastPeriodKey: null,
            lastRunAt: null,
            lastFinishedAt: null,
            lastDurationMs: null,
            lastResult: null,
            lastStats: null,
            lastError: null,
          },
        },
        { upsert: true }
      );
    } catch (err) {
      console.error(`[cron] Failed to initialize lock record for ${job.name}:`, err.message);
    }
  }
};

/**
 * Executes a job safely with database locking, in-memory overlap guard, 25-minute timeout, and safe logging.
 * 
 * @param {Object} jobDef
 * @param {Object} [options]
 * @param {boolean} [options.isCatchUp=false]
 * @param {string} [options.targetPeriodKey=null]
 */
export const executeJobWithLock = async (jobDef, options = {}) => {
  const { targetPeriodKey = null } = options;
  const { name, schedule, type, runner } = jobDef;

  // 1. In-memory overlap guard
  if (activeRuns.has(name)) {
    console.log(`[cron] ${name} skipped (still running)`);
    return { status: "skipped", reason: "still running" };
  }

  // 2. Determine period key
  const periodKey = targetPeriodKey || getPeriodKey(name, type, new Date(), jobDef.timezone);

  // 3. Database atomic lock (25 minute stale lock timeout)
  const cutoff = new Date(Date.now() - JOB_TIMEOUT_MS);

  let lockDoc = null;
  try {
    lockDoc = await CronJobLock.findOneAndUpdate(
      {
        name,
        lastPeriodKey: { $ne: periodKey },
        $or: [
          { lockedAt: null },
          { lockedAt: { $lt: cutoff } },
        ],
      },
      {
        $set: {
          lockedAt: new Date(),
          lockedBy: `pid-${process.pid}`,
          running: true,
          schedule,
          timezone: jobDef.timezone,
        },
      },
      { new: true }
    );
  } catch (err) {
    console.error(`[cron] Error acquiring atomic DB lock for ${name}:`, err.message);
    return { status: "error", error: err.message };
  }

  if (!lockDoc) {
    // Check reason for failure to acquire
    const existing = await CronJobLock.findOne({ name }).lean().catch(() => null);
    if (existing && existing.lastPeriodKey === periodKey) {
      console.log(`[cron] ${name} skipped (already ran)`);
      return { status: "skipped", reason: "already ran" };
    } else {
      console.log(`[cron] ${name} skipped (still running)`);
      return { status: "skipped", reason: "still running" };
    }
  }

  // 4. Lock acquired: add to in-memory guard & log start
  activeRuns.add(name);
  console.log(`[cron] ${name} started`);

  const startTime = Date.now();
  let result = "ok";
  let errorMessage = null;
  let stats = null;

  try {
    const runRes = await withTimeout(
      runner({ dryRun: false, force: false, timeBudgetMs: 25000 }),
      JOB_TIMEOUT_MS,
      name
    );

    if (runRes) {
      if (runRes.stats) {
        stats = runRes.stats;
      } else if (typeof runRes.processed === "number") {
        stats = {
          processed: runRes.processed,
          sent: runRes.sent,
          skipped: runRes.skipped,
          remaining: runRes.remaining,
        };
      }
    }
  } catch (err) {
    result = "error";
    errorMessage = err.message || "Unknown error";
    console.error(`[cron] ${name} error:`, errorMessage);
  } finally {
    const durationMs = Date.now() - startTime;
    activeRuns.delete(name);

    // Release atomic lock in database
    await CronJobLock.updateOne(
      { name },
      {
        $set: {
          lockedAt: null,
          lockedBy: null,
          running: false,
          lastPeriodKey: periodKey,
          lastRunAt: new Date(startTime),
          lastFinishedAt: new Date(),
          lastDurationMs: durationMs,
          lastResult: result,
          lastStats: stats,
          lastError: errorMessage,
        },
      }
    ).catch((err) => {
      console.error(`[cron] Error releasing lock for ${name}:`, err.message);
    });

    if (result === "ok") {
      let statsText = "";
      if (stats) {
        if (typeof stats.processed === "number") {
          statsText = ` (processed=${stats.processed}, sent=${stats.sent || 0}, skipped=${stats.skipped || 0}, remaining=${stats.remaining || 0})`;
        } else {
          statsText = ` (eligible=${stats.eligible || 0}, sent=${stats.sent || 0}, skipped=${stats.skipped || 0}, failed=${stats.failed || 0})`;
        }
      }
      console.log(`[cron] ${name} finished in ${durationMs} ms${statsText}`);
    }
  }

  return {
    status: result,
    durationMs: Date.now() - startTime,
    stats,
    error: errorMessage,
  };
};

/**
 * Checks for daily and weekly jobs due within the last 6 hours that haven't run, and runs them once.
 */
export const runStartupCatchUp = async () => {
  for (const job of REGISTERED_JOBS) {
    if (job.type !== "daily" && job.type !== "weekly") continue;

    const dueCheck = checkDueWithinLast6Hours(
      job.name,
      job.type,
      job.schedule,
      job.timezone
    );

    if (dueCheck.isDue && dueCheck.periodKey) {
      try {
        const existing = await CronJobLock.findOne({ name: job.name }).lean();
        if (existing && existing.lastPeriodKey === dueCheck.periodKey) {
          // Already ran for this scheduled period
          continue;
        }

        console.log(`[cron] Catch-up triggered for ${job.name} (due within last 6h at ${dueCheck.scheduledTime.toISOString()})`);
        await executeJobWithLock(job, {
          isCatchUp: true,
          targetPeriodKey: dueCheck.periodKey,
        });
      } catch (err) {
        console.error(`[cron] Catch-up error for ${job.name}:`, err.message);
      }
    }
  }
};

/**
 * Initializes the production internal cron scheduler.
 * Enabled only when ENABLE_INTERNAL_CRON=true.
 */
export const initScheduler = async () => {
  if (!env.ENABLE_INTERNAL_CRON) {
    console.log("ℹ️ Internal cron scheduler is disabled (ENABLE_INTERNAL_CRON is false).");
    return;
  }

  console.log("⏰ Initializing production internal cron scheduler...");

  // Initialize DB records for all registered jobs
  await ensureJobLockRecords();

  // Register and schedule all 5 jobs
  for (const job of REGISTERED_JOBS) {
    if (cron.validate(job.schedule)) {
      const task = cron.schedule(
        job.schedule,
        async () => {
          await executeJobWithLock(job);
        },
        { timezone: job.timezone }
      );
      scheduledTasks.push({ name: job.name, task });
      // Log one line per registered job with schedule and timezone
      console.log(`[cron] Registered job "${job.name}" with schedule "${job.schedule}" (${job.timezone})`);
    } else {
      console.error(`[cron] Invalid cron expression for ${job.name}: "${job.schedule}"`);
    }
  }

  // Register self-test job if CRON_SELF_TEST is enabled
  if (env.CRON_SELF_TEST) {
    const selfTestTask = cron.schedule(
      "* * * * *",
      () => {
        const istTime = formatIstDateTime(new Date());
        console.log(`[cron] self-test tick ${istTime}`);
      },
      { timezone: "Asia/Kolkata" }
    );
    scheduledTasks.push({ name: "self-test", task: selfTestTask });
    console.log('[cron] Registered job "self-test" with schedule "* * * * *" (Asia/Kolkata)');
  }

  // Run catch-up asynchronously after startup so we do not block server listening
  setTimeout(() => {
    runStartupCatchUp().catch((err) => {
      console.error("[cron] Startup catch-up failed:", err.message);
    });
  }, 1000);
};

/**
 * Retrieves the status of all registered jobs for the GET /api/cron/status endpoint.
 * Protected, returning counts, timings, next run time, and no personal data or secrets.
 */
export const getSchedulerStatus = async () => {
  const lockDocs = await CronJobLock.find().lean().catch(() => []);
  const docMap = new Map(lockDocs.map((d) => [d.name, d]));

  const jobsStatus = REGISTERED_JOBS.map((job) => {
    const doc = docMap.get(job.name) || null;
    const isRunning =
      activeRuns.has(job.name) ||
      Boolean(
        doc?.running &&
        doc?.lockedAt &&
        Date.now() - new Date(doc.lockedAt).getTime() < JOB_TIMEOUT_MS
      );

    return {
      name: job.name,
      schedule: job.schedule,
      timezone: job.timezone,
      lastRunAt: doc?.lastRunAt || null,
      lastDurationMs: doc?.lastDurationMs != null ? doc.lastDurationMs : null,
      lastResult: doc?.lastResult || null,
      nextRunAt: computeNextRun(job.schedule, job.timezone),
      running: isRunning,
    };
  });

  return {
    success: true,
    internalCronEnabled: Boolean(env.ENABLE_INTERNAL_CRON),
    selfTest: Boolean(env.CRON_SELF_TEST),
    jobs: jobsStatus,
  };
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
  activeRuns.clear();
};
