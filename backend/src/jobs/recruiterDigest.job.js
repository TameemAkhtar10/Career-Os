import { User } from "../models/user.model.js";
import { Job } from "../models/job.model.js";
import { Application } from "../models/application.model.js";
import { acquireCronLock, finalizeCronLock } from "./cronLock.js";
import {
  escapeHtml,
  sendScheduledDigestEmail,
  sendBatchWithDelay,
} from "../services/email.service.js";
import { generateUnsubscribeToken } from "../services/unsubscribeToken.service.js";
import { env } from "../config/env.js";

const TASK_NAME = "recruiter-digest";

/**
 * Executes the Daily Recruiter Digest task.
 * Lists new applicants in the last 24h and total pending reviews per open job.
 * Candidate email and phone are NEVER included.
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
    const past24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const frontendUrl = env.FRONTEND_URL || env.CLIENT_URL || "http://localhost:3001";

    // 1. Find all verified, active recruiters with applicantDigest enabled
    const recruiters = await User.find({
      role: "recruiter",
      isEmailVerified: true,
      status: "active",
      "emailPreferences.applicantDigest": { $ne: false },
    }).lean();

    const queue = [];

    // 2. For each recruiter, inspect their open jobs
    for (const recruiter of recruiters) {
      const openJobs = await Job.find({
        recruiter: recruiter._id,
        status: "open",
      })
        .select("_id title companyName location")
        .lean();

      if (openJobs.length === 0) {
        stats.skipped += 1;
        continue;
      }

      const jobsWithActivity = [];
      let totalNewApplicants = 0;
      let totalPendingApplicants = 0;

      for (const job of openJobs) {
        const [newIn24h, pendingCount] = await Promise.all([
          Application.countDocuments({
            job: job._id,
            createdAt: { $gte: past24h },
          }),
          Application.countDocuments({
            job: job._id,
            status: "applied",
          }),
        ]);

        if (newIn24h > 0 || pendingCount > 0) {
          jobsWithActivity.push({
            job,
            newIn24h,
            pendingCount,
          });
          totalNewApplicants += newIn24h;
          totalPendingApplicants += pendingCount;
        }
      }

      // Skip recruiters with nothing new or pending
      if (jobsWithActivity.length === 0) {
        stats.skipped += 1;
        continue;
      }

      stats.eligible += 1;
      queue.push({
        recruiter,
        jobsWithActivity,
        totalNewApplicants,
        totalPendingApplicants,
      });
    }

    // 3. Dry run check
    if (dryRun) {
      note = `Dry run completed. ${stats.eligible} recruiters have active applicants to review.`;
      await finalizeCronLock({
        runDoc: lock.runDoc,
        status: "done",
        stats,
        error: note,
      });
      return { task: TASK_NAME, status: "done", stats, note, dryRun: true };
    }

    // 4. Send emails in batches
    const batchResult = await sendBatchWithDelay({
      items: queue,
      concurrency: 5,
      delayMs: 300,
      checkCap: true,
      sendItemFn: async ({ recruiter, jobsWithActivity, totalNewApplicants, totalPendingApplicants }) => {
        const unsubscribeToken = generateUnsubscribeToken({
          userId: recruiter._id,
          type: "applicantDigest",
        });

        const jobRowsHtml = jobsWithActivity
          .map(({ job, newIn24h, pendingCount }) => {
            const applicantsUrl = `${frontendUrl}/recruiter/jobs/${job._id}/applicants`;

            return `
              <div style="background-color: #FFFFFF; border: 1px solid #E8D3AA; border-radius: 10px; padding: 18px; margin-bottom: 14px;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
                  <div>
                    <h3 style="margin: 0 0 4px; font-size: 16px; font-weight: 700; color: #064E3B;">
                      ${escapeHtml(job.title)}
                    </h3>
                    <p style="margin: 0; font-size: 13px; color: #6B7280;">
                      ${escapeHtml(job.companyName || "")}
                    </p>
                  </div>
                </div>

                <div style="margin: 12px 0; display: flex; gap: 12px;">
                  <span style="display: inline-block; background-color: #E8F8F2; color: #064E3B; font-weight: 600; font-size: 13px; padding: 4px 10px; border-radius: 6px; border: 1px solid #A7F3D0;">
                    +${newIn24h} new in last 24h
                  </span>
                  <span style="display: inline-block; background-color: #FBF3E2; color: #064E3B; font-weight: 600; font-size: 13px; padding: 4px 10px; border-radius: 6px; border: 1px solid #C8963E;">
                    ${pendingCount} pending review
                  </span>
                </div>

                <div style="text-align: right; margin-top: 12px;">
                  <a href="${applicantsUrl}"
                     style="display: inline-block; background-color: #064E3B; color: #FFF8EC; font-size: 13px; font-weight: 600; text-decoration: none; padding: 8px 16px; border-radius: 6px;">
                    Review Applicants &rarr;
                  </a>
                </div>
              </div>
            `;
          })
          .join("");

        const bodyHtml = `
          <p style="margin: 0 0 16px;">Hi ${escapeHtml(recruiter.name || "Recruiter")},</p>
          <p style="margin: 0 0 20px;">
            Here is your daily summary of applicant activity across your active job postings. You have <strong>${totalNewApplicants} new applicant${totalNewApplicants === 1 ? "" : "s"}</strong> in the last 24 hours and <strong>${totalPendingApplicants} application${totalPendingApplicants === 1 ? "" : "s"}</strong> awaiting review.
          </p>

          ${jobRowsHtml}

          <p style="margin: 20px 0 0; font-size: 13px; color: #6B7280; text-align: center;">
            For privacy and security, candidate contact details are only accessible inside your authenticated dashboard.
          </p>
        `;

        const textContent = `Hi ${recruiter.name || "Recruiter"},\n\nHere is your daily applicant digest:\nTotal new in last 24h: ${totalNewApplicants}\nTotal pending review: ${totalPendingApplicants}\n\n${jobsWithActivity
          .map(
            ({ job, newIn24h, pendingCount }) =>
              `• ${job.title} (${job.companyName})\n  New in 24h: ${newIn24h} | Total pending: ${pendingCount}\n  Review: ${frontendUrl}/recruiter/jobs/${job._id}/applicants`
          )
          .join("\n\n")}\n\nManage your jobs: ${frontendUrl}/recruiter/dashboard`;

        await sendScheduledDigestEmail({
          to: recruiter.email,
          toName: recruiter.name,
          subject: `Career OS: Daily Applicant Digest (${totalNewApplicants} New, ${totalPendingApplicants} Pending)`,
          heading: "Daily Recruiter Digest",
          bodyHtml,
          textContent,
          ctaText: "Go to Recruiter Dashboard",
          ctaUrl: `${frontendUrl}/recruiter/dashboard`,
          unsubscribeToken,
          unsubscribeType: "applicantDigest",
          footerReason: "You received this email because you have applicant digest notifications enabled for your recruiter account.",
        });
      },
    });

    stats.sent = batchResult.sent;
    stats.failed = batchResult.failed;
    stats.skipped += batchResult.skipped;

    if (batchResult.capHit) {
      note = "Daily email cap reached. Task stopped to preserve quota for transactional emails.";
    }

    await finalizeCronLock({
      runDoc: lock.runDoc,
      status: "done",
      stats,
      error: note,
    });

    return { task: TASK_NAME, status: "done", stats, note };
  } catch (err) {
    console.error(`[recruiterDigest] Error running task:`, err);
    await finalizeCronLock({
      runDoc: lock.runDoc,
      status: "failed",
      stats,
      error: err.message,
    });
    return { task: TASK_NAME, status: "failed", stats, error: err.message };
  }
};

