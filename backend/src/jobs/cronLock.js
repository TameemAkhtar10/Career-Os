import { CronRun } from "../models/cronRun.model.js";
import { getTodayDateString } from "../services/emailCap.service.js";

/**
 * Attempts to take an atomic lock for a cron task run.
 * If force is true, appends a unique timestamp suffix.
 * Returns { locked: true, runDoc, key } or { locked: false, key, reason }.
 */
export const acquireCronLock = async ({ task, dryRun = false, force = false }) => {
  const today = getTodayDateString();
  const baseKey = `${task}:${today}`;
  const key = force ? `${baseKey}:force:${Date.now()}` : baseKey;

  try {
    const runDoc = await CronRun.create({
      task,
      key,
      status: "running",
      startedAt: new Date(),
      dryRun: Boolean(dryRun),
      stats: { eligible: 0, sent: 0, skipped: 0, failed: 0 },
    });

    return { locked: true, runDoc, key };
  } catch (err) {
    if (err.code === 11000) {
      console.warn(`[cronLock] Task '${task}' with key '${key}' has already run or is currently running today.`);
      return {
        locked: false,
        key,
        reason: `Task '${task}' has already been executed for ${today}. Use force to rerun manually.`,
      };
    }
    throw err;
  }
};

/**
 * Updates the CronRun document to mark completion.
 */
export const finalizeCronLock = async ({
  runDoc,
  status = "done",
  stats = { eligible: 0, sent: 0, skipped: 0, failed: 0 },
  error = null,
}) => {
  if (!runDoc) return null;

  try {
    runDoc.status = status;
    runDoc.finishedAt = new Date();
    runDoc.stats = stats;
    runDoc.error = error;
    await runDoc.save();
    return runDoc;
  } catch (err) {
    console.error(`[cronLock] Failed to finalize CronRun ${runDoc._id}:`, err.message);
    return runDoc;
  }
};

