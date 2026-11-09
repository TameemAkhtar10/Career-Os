import { Job } from "../models/job.model.js";
import { User } from "../models/user.model.js";
import { acquireCronLock, finalizeCronLock } from "./cronLock.js";
import {
  escapeHtml,
  sendScheduledDigestEmail,
  sendBatchWithDelay,
} from "../services/email.service.js";
import { generateUnsubscribeToken } from "../services/unsubscribeToken.service.js";
import { delByPrefix } from "../utils/cache.js";
import { env } from "../config/env.js";

const TASK_NAME = "job-auto-close";

/**
 * Executes the Job Auto-Close task.
 * Soft-closes open jobs whose applicationDeadline has expired, invalidates job caches,
 * and notifies recruiters with a summary email.
 */
export const run = async ({ dryRun = false, force = false } = {}) => {
  const lock = await acquireCronLock({ task: TASK_NAME, dryRun, force });
  if (!lock.locked) {
    return {
      task: TASK_NAME,
      status: "skipped",
      reason: lock.reason,
      stats: { eligible: 0, sent: 0, skipped: 0, failed: 0 },
    };
  }

  const stats = { eligible: 0, sent: 0, skipped: 0, failed: 0 };
  let note = null;

  try {
    const now = new Date();
    const frontendUrl = env.FRONTEND_URL || env.CLIENT_URL || "http://localhost:3001";

    // 1. Find all open jobs whose application deadline has passed
    const expiredJobs = await Job.find({
      status: "open",
      applicationDeadline: { $ne: null, $lt: now },
    })
      .select("_id title companyName applicationDeadline recruiter")
      .lean();

    if (expiredJobs.length === 0) {
      note = "No expired jobs found to close.";
      await finalizeCronLock({
        runDoc: lock.runDoc,
        status: "done",
        stats,
        error: note,
      });
      return { task: TASK_NAME, status: "done", stats, note };
    }

    stats.eligible = expiredJobs.length;

    // 2. Dry run preview
    if (dryRun) {
      note = `Dry run completed. ${expiredJobs.length} expired job(s) would be closed.`;
      await finalizeCronLock({
        runDoc: lock.runDoc,
        status: "done",
        stats,
        error: note,
      });
      return { task: TASK_NAME, status: "done", stats, note, dryRun: true };
    }

    // 3. Soft close all expired jobs
    const jobIds = expiredJobs.map((j) => j._id);
    await Job.updateMany(
      { _id: { $in: jobIds } },
      { $set: { status: "closed" } }
    );

    // 4. Invalidate job cache entries
    try {
      await delByPrefix("cache:/api/jobs");
    } catch (err) {
      console.error("[jobAutoClose] Failed to clear job caches:", err.message);
    }

    // 5. Group closed jobs by recruiter
    const jobsByRecruiter = new Map();
    for (const job of expiredJobs) {
      if (!job.recruiter) continue;
      const rId = String(job.recruiter);
      if (!jobsByRecruiter.has(rId)) {
        jobsByRecruiter.set(rId, []);
      }
      jobsByRecruiter.get(rId).push(job);
    }

    // 6. Fetch verified & active recruiters
    const recruiterIds = Array.from(jobsByRecruiter.keys());
    const recruiters = await User.find({
      _id: { $in: recruiterIds },
      role: "recruiter",
      isEmailVerified: true,
      status: "active",
      "emailPreferences.applicantDigest": { $ne: false },
    }).lean();

    const queue = recruiters.map((recruiter) => ({
      recruiter,
      closedJobs: jobsByRecruiter.get(String(recruiter._id)) || [],
    }));

    // 7. Send summary email to each recruiter
    const batchResult = await sendBatchWithDelay({
      items: queue,
      concurrency: 5,
      delayMs: 300,
      checkCap: true,
      sendItemFn: async ({ recruiter, closedJobs }) => {
        if (closedJobs.length === 0) return;

        const unsubscribeToken = generateUnsubscribeToken({
          userId: recruiter._id,
          type: "applicantDigest",
        });

        const jobListHtml = closedJobs
          .map(
            (j) => `
              <li style="margin-bottom: 8px;">
                <strong>${escapeHtml(j.title)}</strong>
                <span style="color: #6B7280; font-size: 13px;"> (Deadline: ${new Date(j.applicationDeadline).toLocaleDateString()})</span>
              </li>
            `
          )
          .join("");

        const bodyHtml = `
          <p style="margin: 0 0 16px;">Hi ${escapeHtml(recruiter.name || "Recruiter")},</p>
          <p style="margin: 0 0 16px;">
            This is an automated notice that <strong>${closedJobs.length} of your job posting${closedJobs.length === 1 ? "" : "s"}</strong> ${closedJobs.length === 1 ? "has" : "have"} been automatically closed because the application deadline passed:
          </p>
          <div style="background-color: #FFFFFF; border: 1px solid #E8D3AA; border-radius: 8px; padding: 16px 20px; margin: 16px 0;">
            <ul style="margin: 0; padding-left: 20px; color: #064E3B;">
              ${jobListHtml}
            </ul>
          </div>
          <p style="margin: 0 0 8px; font-size: 14px; color: #2D3748;">
            Candidates can no longer submit new applications for these roles. All existing applications remain accessible on your dashboard for review.
          </p>
        `;

        const textContent = `Hi ${recruiter.name || "Recruiter"},\n\n${closedJobs.length} of your job posting(s) have been closed because the application deadline passed:\n\n${closedJobs
          .map((j) => `• ${j.title} (Deadline: ${new Date(j.applicationDeadline).toLocaleDateString()})`)
          .join("\n")}\n\nExisting applications remain accessible on your dashboard: ${frontendUrl}/recruiter/dashboard`;

        await sendScheduledDigestEmail({
          to: recruiter.email,
          toName: recruiter.name,
          subject: `Career OS Notice: ${closedJobs.length} Job Listing${closedJobs.length === 1 ? "" : "s"} Closed`,
          heading: "Job Deadline Notice",
          bodyHtml,
          textContent,
          ctaText: "View Recruiter Dashboard",
          ctaUrl: `${frontendUrl}/recruiter/dashboard`,
          unsubscribeToken,
          unsubscribeType: "applicantDigest",
          footerReason: "You received this notice because you manage active job postings on Career OS.",
        });
      },
    });

    stats.sent = batchResult.sent;
    stats.failed = batchResult.failed;
    stats.skipped = Math.max(0, queue.length - batchResult.sent - batchResult.failed);

    if (batchResult.capHit) {
      note = "Daily email cap reached. Task completed closing jobs, but some recruiter notification emails were deferred.";
    }

    await finalizeCronLock({
      runDoc: lock.runDoc,
      status: "done",
      stats,
      error: note,
    });

    return { task: TASK_NAME, status: "done", stats, note };
  } catch (err) {
    console.error(`[jobAutoClose] Error running task:`, err);
    await finalizeCronLock({
      runDoc: lock.runDoc,
      status: "failed",
      stats,
      error: err.message,
    });
    return { task: TASK_NAME, status: "failed", stats, error: err.message };
  }
};

