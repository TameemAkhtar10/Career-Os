import { JobAlert } from "../models/jobAlert.model.js";
import { Job } from "../models/job.model.js";
import { User } from "../models/user.model.js";
import { buildPublicJobsFilter } from "../utils/jobFilter.js";
import {
  escapeHtml,
  sendScheduledDigestEmail,
} from "../services/email.service.js";
import { generateUnsubscribeToken } from "../services/unsubscribeToken.service.js";
import { generatePauseAlertToken } from "../services/alertToken.service.js";
import { env } from "../config/env.js";

export const TASK_NAME = "job-alerts";

// 20 hours in milliseconds for daily alerts
export const DAILY_DUE_MS = 20 * 60 * 60 * 1000;
// 6.5 days in milliseconds for weekly alerts
export const WEEKLY_DUE_MS = 6.5 * 24 * 60 * 60 * 1000;

/**
 * Pure helper to test if an active alert is due to be sent.
 * Daily: >= 20 hours since lastSentAt (or never sent)
 * Weekly: >= 6.5 days since lastSentAt (or never sent)
 * 
 * @param {Object} alert
 * @param {Date} [now]
 * @returns {boolean}
 */
export const isAlertDue = (alert, now = new Date()) => {
  if (!alert || !alert.active) return false;
  if (!alert.lastSentAt) return true; // never sent before

  const elapsed = now.getTime() - new Date(alert.lastSentAt).getTime();
  if (alert.frequency === "weekly") {
    return elapsed >= WEEKLY_DUE_MS;
  }
  return elapsed >= DAILY_DUE_MS;
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
 * Runs the Job Alerts processing runner with a 25-second time budget.
 * Returns { processed, sent, skipped, remaining }.
 * 
 * @param {Object} options
 * @param {number} [options.timeBudgetMs=25000] - Max runtime in ms
 * @param {Date} [options.nowDate] - For deterministic test time injection
 * @returns {Promise<{ processed: number, sent: number, skipped: number, remaining: number }>}
 */
export const runJobAlerts = async ({
  timeBudgetMs = 25000,
  nowDate = new Date(),
} = {}) => {
  const startTime = Date.now();
  const now = nowDate instanceof Date ? nowDate : new Date(nowDate);

  // 1. Fetch all active alerts populated with user
  const activeAlerts = await JobAlert.find({ active: true })
    .populate({
      path: "user",
      select: "name email role status isEmailVerified emailPreferences",
    })
    .sort({ lastCheckedAt: 1, createdAt: 1 });

  // 2. Filter alerts that are due
  const dueAlerts = activeAlerts.filter((alert) => isAlertDue(alert, now));

  let processed = 0;
  let sent = 0;
  let skipped = 0;

  const frontendUrl = env.FRONTEND_URL || env.CLIENT_URL || "http://localhost:3001";

  for (let i = 0; i < dueAlerts.length; i++) {
    // Check time budget to prevent HTTP gateway timeouts
    if (Date.now() - startTime >= timeBudgetMs) {
      break;
    }

    const alert = dueAlerts[i];
    processed += 1;

    const user = alert.user;

    // Validate candidate user eligibility
    // Must exist, active, verified email, and NOT opted out of jobAlerts
    if (
      !user ||
      user.status !== "active" ||
      !user.isEmailVerified ||
      user.emailPreferences?.jobAlerts === false
    ) {
      skipped += 1;
      alert.lastCheckedAt = now;
      await alert.save().catch(() => {});
      continue;
    }

    // 3. Query open jobs newer than lastCheckedAt using identical filter logic
    const createdAfter = alert.lastCheckedAt || alert.createdAt;
    const filter = buildPublicJobsFilter({
      q: alert.filters?.q,
      city: alert.filters?.location,
      workMode: alert.filters?.workMode,
      jobType: alert.filters?.jobType,
      skills: alert.filters?.skills,
      fresher: alert.filters?.fresher,
      minSalary: alert.filters?.minSalary,
      createdAfter,
    });

    const matchingJobs = await Job.find(filter)
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // If no new matching jobs, update lastCheckedAt and skip
    if (!matchingJobs || matchingJobs.length === 0) {
      skipped += 1;
      alert.lastCheckedAt = now;
      await alert.save().catch(() => {});
      continue;
    }

    // 4. Tokens for unsubscribe & one-click pause
    let unsubscribeToken = "";
    let pauseToken = "";
    try {
      unsubscribeToken = generateUnsubscribeToken({
        userId: user._id,
        type: "jobAlerts",
      });
      pauseToken = generatePauseAlertToken({
        alertId: alert._id,
        userId: user._id,
      });
    } catch {
      // In tests or if secret missing
    }

    const pauseAlertUrl = `${frontendUrl}/candidate/alerts?pauseToken=${encodeURIComponent(pauseToken)}`;

    // 5. Construct email HTML
    const jobCardsHtml = matchingJobs
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
        Here are <strong>${matchingJobs.length} new role${matchingJobs.length > 1 ? "s" : ""}</strong> matching your alert <strong>"${escapeHtml(alert.name)}"</strong>:
      </p>
      ${jobCardsHtml}
      <div style="margin-top: 24px; text-align: center;">
        <a href="${frontendUrl}/jobs" style="color: #064E3B; font-weight: 600; text-decoration: underline; font-size: 14px;">
          Browse all open roles on Career OS &rarr;
        </a>
      </div>
      <div style="margin-top: 20px; text-align: center; font-size: 12px; color: #6B7280;">
        <a href="${pauseAlertUrl}" style="color: #C8963E; font-weight: 600; text-decoration: underline;">
          Pause this alert ("${escapeHtml(alert.name)}") with 1 click
        </a>
      </div>
    `;

    const textContent = `Hi ${user.name || "Candidate"},\n\nHere are ${matchingJobs.length} new jobs matching your alert "${alert.name}":\n\n${matchingJobs
      .map(
        (j, idx) =>
          `${idx + 1}. ${j.title} at ${j.companyName} (${j.location?.city || "Remote"})\n   Apply: ${frontendUrl}/jobs/${j._id}`
      )
      .join("\n\n")}\n\nPause this alert: ${pauseAlertUrl}\n\nExplore more: ${frontendUrl}/jobs`;

    try {
      await sendScheduledDigestEmail({
        to: user.email,
        toName: user.name,
        subject: `Career OS Alert: ${matchingJobs.length} New Job${matchingJobs.length > 1 ? "s" : ""} for "${alert.name}"`,
        heading: `Job Alert: ${alert.name}`,
        bodyHtml,
        textContent,
        ctaText: "View Matching Jobs",
        ctaUrl: `${frontendUrl}/jobs`,
        unsubscribeToken,
        unsubscribeType: "jobAlerts",
        footerReason: `You received this email because you created the job alert "${alert.name}" on Career OS.`,
      });

      sent += 1;
      alert.lastSentAt = now;
      alert.lastCheckedAt = now;
      await alert.save();
    } catch (err) {
      // Log count only, never email addresses or tokens
      skipped += 1;
      alert.lastCheckedAt = now;
      await alert.save().catch(() => {});
    }
  }

  const remaining = dueAlerts.length - processed;

  // Log counts only
  console.log(
    `[cron:job-alerts] Alerts summary: processed=${processed}, sent=${sent}, skipped=${skipped}, remaining=${remaining}`
  );

  return { processed, sent, skipped, remaining };
};
