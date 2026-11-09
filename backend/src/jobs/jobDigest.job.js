import { User } from "../models/user.model.js";
import { Job } from "../models/job.model.js";
import { CandidateProfile } from "../models/candidateProfile.model.js";
import { DigestLog } from "../models/digestLog.model.js";
import { acquireCronLock, finalizeCronLock } from "./cronLock.js";
import {
  escapeHtml,
  sendScheduledDigestEmail,
  sendBatchWithDelay,
} from "../services/email.service.js";
import { generateUnsubscribeToken } from "../services/unsubscribeToken.service.js";
import { env } from "../config/env.js";

const TASK_NAME = "job-digest";

/**
 * Calculates skill overlap score between candidate skills and job skills.
 * Adds a small bonus (0.1) if candidate's city matches job's city.
 */
const calculateMatchScore = (candidateSkills, candidateCity, job) => {
  if (!job.skills || job.skills.length === 0 || !candidateSkills || candidateSkills.length === 0) {
    return 0;
  }

  const jobSkillsLower = job.skills.map((s) => String(s).toLowerCase().trim());
  let overlapCount = 0;
  for (const skill of candidateSkills) {
    if (jobSkillsLower.includes(skill)) {
      overlapCount += 1;
    }
  }

  if (overlapCount === 0) return 0;

  let score = overlapCount;
  const jobCity = job.location?.city ? String(job.location.city).toLowerCase().trim() : "";
  if (candidateCity && jobCity && candidateCity === jobCity) {
    score += 0.1; // city preference
  }

  return score;
};

/**
 * Formats salary string if visible.
 */
const formatSalary = (salary) => {
  if (!salary || !salary.isVisible) return null;
  const currency = salary.currency || "INR";
  if (salary.min != null && salary.max != null) {
    return `${currency} ${salary.min.toLocaleString()} – ${salary.max.toLocaleString()}`;
  }
  if (salary.min != null) return `From ${currency} ${salary.min.toLocaleString()}`;
  if (salary.max != null) return `Up to ${currency} ${salary.max.toLocaleString()}`;
  return null;
};

/**
 * Executes the Daily Job Digest task.
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
    const now = new Date();

    // 1. Find jobs created in the last 24h with status open and unexpired deadline
    const recentJobs = await Job.find({
      status: "open",
      createdAt: { $gte: past24h },
      $or: [{ applicationDeadline: null }, { applicationDeadline: { $gte: now } }],
    }).lean();

    if (recentJobs.length === 0) {
      note = "No open jobs posted in the last 24 hours.";
      await finalizeCronLock({
        runDoc: lock.runDoc,
        status: "done",
        stats,
        error: note,
      });
      return { task: TASK_NAME, status: "done", stats, note };
    }

    // 2. Find eligible candidate profiles with openToWork true
    const profiles = await CandidateProfile.find({
      openToWork: { $ne: false },
    })
      .populate({
        path: "user",
        match: {
          role: "candidate",
          isEmailVerified: true,
          status: "active",
          "emailPreferences.jobAlerts": { $ne: false },
        },
      })
      .lean();

    const frontendUrl = env.FRONTEND_URL || env.CLIENT_URL || "http://localhost:3001";
    const queue = [];

    // 3. For each verified, active candidate, rank matching jobs
    for (const profile of profiles) {
      if (!profile.user) continue; // skipped unverified or suspended or disabled preferences
      const user = profile.user;

      const candidateSkills = (profile.skills || []).map((s) => String(s).toLowerCase().trim());
      const candidateCity = profile.location?.city ? String(profile.location.city).toLowerCase().trim() : "";

      // Check which jobs were already sent to this candidate in the last 30 days
      const alreadySentJobIds = await DigestLog.find({ user: user._id }).distinct("job");
      const alreadySentSet = new Set(alreadySentJobIds.map((id) => String(id)));

      const scoredJobs = [];
      for (const job of recentJobs) {
        if (alreadySentSet.has(String(job._id))) continue;

        const score = calculateMatchScore(candidateSkills, candidateCity, job);
        if (score > 0) {
          scoredJobs.push({ job, score });
        }
      }

      if (scoredJobs.length === 0) {
        stats.skipped += 1;
        continue;
      }

      // Sort by score descending and take top 5
      scoredJobs.sort((a, b) => b.score - a.score);
      const topJobs = scoredJobs.slice(0, 5).map((item) => item.job);

      stats.eligible += 1;

      queue.push({
        user,
        jobs: topJobs,
      });
    }

    // 4. If dryRun, do not send emails or write DigestLog
    if (dryRun) {
      note = `Dry run completed. ${stats.eligible} candidates would receive job digests.`;
      await finalizeCronLock({
        runDoc: lock.runDoc,
        status: "done",
        stats,
        error: note,
      });
      return { task: TASK_NAME, status: "done", stats, note, dryRun: true };
    }

    // 5. Send emails with batching and daily cap check
    const batchResult = await sendBatchWithDelay({
      items: queue,
      concurrency: 5,
      delayMs: 300,
      checkCap: true,
      sendItemFn: async ({ user, jobs }) => {
        const unsubscribeToken = generateUnsubscribeToken({
          userId: user._id,
          type: "jobAlerts",
        });

        const cardsHtml = jobs
          .map((j) => {
            const salaryText = formatSalary(j.salary);
            const locationText = [j.location?.city, j.workMode].filter(Boolean).join(" &bull; ");
            const fresherBadge = j.isFresherFriendly
              ? `<span style="display: inline-block; background-color: #E8F8F2; color: #064E3B; font-size: 11px; font-weight: 700; padding: 2px 7px; border-radius: 4px; border: 1px solid #A7F3D0; margin-left: 6px;">Fresher Friendly</span>`
              : "";

            return `
              <div style="background-color: #FFFFFF; border: 1px solid #E8D3AA; border-radius: 10px; padding: 18px; margin-bottom: 14px;">
                <div style="margin-bottom: 6px;">
                  <span style="font-size: 16px; font-weight: 700; color: #064E3B;">${escapeHtml(j.title)}</span>
                  ${fresherBadge}
                </div>
                <div style="font-size: 13px; color: #6B7280; margin-bottom: 8px;">
                  <strong>${escapeHtml(j.companyName)}</strong> &bull; ${escapeHtml(locationText)}
                </div>
                ${
                  salaryText
                    ? `<div style="font-size: 13px; color: #C8963E; font-weight: 600; margin-bottom: 12px;">💰 ${escapeHtml(salaryText)}</div>`
                    : ""
                }
                <div style="text-align: right;">
                  <a href="${frontendUrl}/jobs/${j._id}"
                     style="display: inline-block; background-color: #064E3B; color: #FFF8EC; font-size: 13px; font-weight: 600; text-decoration: none; padding: 8px 16px; border-radius: 6px;">
                    View Job &rarr;
                  </a>
                </div>
              </div>
            `;
          })
          .join("");

        const bodyHtml = `
          <p style="margin: 0 0 16px;">Hi ${escapeHtml(user.name || "Candidate")},</p>
          <p style="margin: 0 0 20px;">
            Here are the newest open positions that match your skills posted in the last 24 hours:
          </p>
          ${cardsHtml}
          <div style="margin-top: 24px; text-align: center;">
            <a href="${frontendUrl}/jobs" style="color: #064E3B; font-weight: 600; text-decoration: underline; font-size: 14px;">
              Explore all open opportunities on Career OS &rarr;
            </a>
          </div>
        `;

        const textContent = `Hi ${user.name || "Candidate"},\n\nHere are new jobs matching your skills:\n\n${jobs
          .map(
            (j, i) =>
              `${i + 1}. ${j.title} at ${j.companyName} (${j.location?.city || "Remote"})\n   Apply: ${frontendUrl}/jobs/${j._id}`
          )
          .join("\n\n")}\n\nExplore more: ${frontendUrl}/jobs`;

        await sendScheduledDigestEmail({
          to: user.email,
          toName: user.name,
          subject: `Career OS: Top ${jobs.length} New Job Match${jobs.length > 1 ? "es" : ""} for You`,
          heading: "Daily Job Alert",
          bodyHtml,
          textContent,
          ctaText: "Browse All Jobs",
          ctaUrl: `${frontendUrl}/jobs`,
          unsubscribeToken,
          unsubscribeType: "jobAlerts",
          footerReason: "You received this email because you turned on job alerts and are open to new opportunities.",
        });

        // Record in DigestLog so candidate won't get the same job emailed again
        const logDocs = jobs.map((j) => ({
          user: user._id,
          job: j._id,
          sentAt: new Date(),
        }));
        await DigestLog.insertMany(logDocs, { ordered: false }).catch(() => {});
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
    console.error(`[jobDigest] Error running task:`, err);
    await finalizeCronLock({
      runDoc: lock.runDoc,
      status: "failed",
      stats,
      error: err.message,
    });
    return { task: TASK_NAME, status: "failed", stats, error: err.message };
  }
};

