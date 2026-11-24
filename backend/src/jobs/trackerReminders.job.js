import TrackerEntry from "../models/TrackerEntry.js";
import { User } from "../models/user.model.js";
import { acquireCronLock, finalizeCronLock } from "./cronLock.js";
import { sendBatchWithDelay, sendScheduledDigestEmail } from "../services/email.service.js";
import { generateUnsubscribeToken } from "../services/unsubscribeToken.service.js";
import { escapeHtml } from "../services/emailLayout.js";
import { env } from "../config/env.js";

const TASK_NAME = "tracker-reminders";

export const runTrackerReminders = async ({ dryRun = false } = {}) => {
  const lock = await acquireCronLock(TASK_NAME);
  if (!lock.acquired) {
    return { task: TASK_NAME, status: "locked", reason: lock.reason };
  }

  const stats = { eligible: 0, sent: 0, failed: 0, skipped: 0 };
  let note = null;

  try {
    const frontendUrl = (env.FRONTEND_URL || "https://careeros.in").replace(/\/$/, "");

    // Find candidates whose reminder is due (follow-up or interview today or tomorrow, or idle for 14 days)
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfTomorrow = new Date(startOfToday.getTime() + 48 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    // Active entries requiring attention
    const candidateEntries = await TrackerEntry.find({
      hidden: { $ne: true },
      remindersEnabled: true,
      $or: [
        { followUpAt: { $gte: startOfToday, $lte: endOfTomorrow } },
        { interviewAt: { $gte: startOfToday, $lte: endOfTomorrow } },
        { stage: { $in: ["applied", "screening"] }, updatedAt: { $lte: fourteenDaysAgo } },
      ],
    })
      .populate("user", "name email status isEmailVerified emailPreferences")
      .lean();

    // Group by user
    const userGroups = new Map();

    for (const entry of candidateEntries) {
      const user = entry.user;
      if (!user || user.status !== "active" || !user.isEmailVerified) continue;
      if (user.emailPreferences?.trackerReminders === false) {
        stats.skipped += 1;
        continue;
      }

      // Check if candidate already received a reminder in the last 20 hours
      if (entry.lastReminderSentAt) {
        const lastSent = new Date(entry.lastReminderSentAt).getTime();
        if (now.getTime() - lastSent < 20 * 60 * 60 * 1000) {
          continue;
        }
      }

      if (!userGroups.has(user._id.toString())) {
        userGroups.set(user._id.toString(), {
          user,
          entries: [],
        });
      }

      const group = userGroups.get(user._id.toString());
      if (group.entries.length < 10) {
        group.entries.push(entry);
      }
    }

    const queue = Array.from(userGroups.values());
    stats.eligible = queue.length;

    if (dryRun) {
      note = `Dry run completed. ${stats.eligible} candidates eligible for tracker reminders.`;
      await finalizeCronLock({
        runDoc: lock.runDoc,
        status: "done",
        stats,
        error: note,
      });
      return { task: TASK_NAME, status: "done", stats, note, dryRun: true };
    }

    const batchResult = await sendBatchWithDelay({
      items: queue,
      concurrency: 5,
      delayMs: 300,
      checkCap: true,
      sendItemFn: async ({ user, entries }) => {
        const unsubscribeToken = generateUnsubscribeToken({
          userId: user._id,
          type: "trackerReminders",
        });

        const itemsHtml = entries
          .map((entry) => {
            let badgeText = "Update";
            let badgeBg = "#E6F4EA";
            let badgeColor = "#064E3B";
            let details = "";

            if (entry.interviewAt && new Date(entry.interviewAt) <= endOfTomorrow) {
              badgeText = "Interview Scheduled";
              badgeBg = "#E6F4EA";
              badgeColor = "#064E3B";
              details = `Time: ${new Date(entry.interviewAt).toLocaleString("en-IN", {
                timeZone: "Asia/Kolkata",
                dateStyle: "medium",
                timeStyle: "short",
              })} IST`;
            } else if (entry.followUpAt && new Date(entry.followUpAt) <= endOfTomorrow) {
              badgeText = "Follow-up Due";
              badgeBg = "#FEF9C3";
              badgeColor = "#854D0E";
              details = "Action: Send a status check or message the hiring team.";
            } else {
              badgeText = "Awaiting Response (14+ days)";
              badgeBg = "#F3F4F6";
              badgeColor = "#4B5563";
              details = "Status has been unchanged for 2 weeks. Consider following up.";
            }

            return `
              <div style="background-color: #FFFFFF; border: 1px solid #E8D3AA; border-radius: 8px; padding: 14px 16px; margin-bottom: 10px;">
                <div style="margin-bottom: 4px;">
                  <strong style="font-size: 15px; color: #064E3B;">${escapeHtml(entry.jobTitle)}</strong>
                  <span style="font-size: 13px; color: #6B7280;"> • ${escapeHtml(entry.company)}</span>
                </div>
                <div style="margin: 6px 0;">
                  <span style="display: inline-block; padding: 2px 8px; font-size: 11px; font-weight: 700; color: ${badgeColor}; background-color: ${badgeBg}; border-radius: 9999px;">
                    ${badgeText}
                  </span>
                </div>
                ${details ? `<p style="margin: 4px 0 0; font-size: 12px; color: #6B7280;">${escapeHtml(details)}</p>` : ""}
              </div>
            `;
          })
          .join("");

        const bodyHtml = `
          <p style="margin: 0 0 16px;">Hi ${escapeHtml(user.name || "Candidate")},</p>
          <p style="margin: 0 0 16px;">
            Here is your daily reminder for job application follow-ups and upcoming interviews:
          </p>
          <div style="margin: 20px 0;">
            ${itemsHtml}
          </div>
          <p style="margin: 0; font-size: 14px; color: #4B5563;">
            Keep your application journey organized and never miss an interview or follow-up deadline.
          </p>
        `;

        const textContent = `Hi ${user.name || "Candidate"},\n\nYour Career OS Application Follow-Up Reminders:\n\n${entries
          .map((e) => `- ${e.jobTitle} at ${e.company} (${e.stage})`)
          .join("\n")}\n\nView tracker: ${frontendUrl}/candidate/tracker`;

        await sendScheduledDigestEmail({
          to: user.email,
          toName: user.name,
          preheader: "Upcoming interview rounds and follow-ups due in Career OS.",
          subject: "Career OS: Application Follow-Up & Interview Reminders",
          heading: "Application Tracker Reminders",
          bodyHtml,
          textContent,
          ctaText: "Open Application Tracker",
          ctaUrl: `${frontendUrl}/candidate/tracker`,
          unsubscribeToken,
          unsubscribeType: "trackerReminders",
          footerReason: "You received this reminder because application reminders are enabled in your preferences.",
        });

        // Mark lastReminderSentAt on entries
        const entryIds = entries.map((e) => e._id);
        await TrackerEntry.updateMany({ _id: { $in: entryIds } }, { lastReminderSentAt: now });
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
  } catch (error) {
    await finalizeCronLock({
      runDoc: lock.runDoc,
      status: "failed",
      stats,
      error: error.message,
    });
    throw error;
  }
};
