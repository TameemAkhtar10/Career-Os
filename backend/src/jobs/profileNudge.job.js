import { User } from "../models/user.model.js";
import { CandidateProfile } from "../models/candidateProfile.model.js";
import { calculateCandidateCompleteness } from "../controllers/profile.controller.js";
import { acquireCronLock, finalizeCronLock } from "./cronLock.js";
import {
  escapeHtml,
  sendScheduledDigestEmail,
  sendBatchWithDelay,
} from "../services/email.service.js";
import { generateUnsubscribeToken } from "../services/unsubscribeToken.service.js";
import { env } from "../config/env.js";

const TASK_NAME = "profile-nudge";

/**
 * Identifies the top 2-3 most valuable missing sections of a candidate's profile.
 */
const getMissingItems = (profile) => {
  const missing = [];

  // 1. Skills (20% weight)
  if (!profile.skills || profile.skills.length === 0) {
    missing.push({
      title: "Add your key skills",
      description: "Recruiters search by skill sets. Adding skills helps our matching algorithm feature you.",
    });
  }

  // 2. Resume (5% weight + essential for recruiter review)
  if (!profile.resumeUrl && !profile.resume?.fileId) {
    missing.push({
      title: "Upload your resume",
      description: "A PDF resume allows recruiters to review your background with 1 click.",
    });
  }

  // 3. Projects (15% weight)
  if (!profile.projects || profile.projects.length === 0) {
    missing.push({
      title: "Showcase your projects",
      description: "Highlight projects and GitHub links that showcase your practical abilities.",
    });
  }

  // 4. Education (15% weight)
  if (!profile.education || profile.education.length === 0) {
    missing.push({
      title: "Add your education",
      description: "Include your degree, institute, and graduation year.",
    });
  }

  // 5. Headline (10% weight)
  if (!profile.headline || profile.headline.trim().length === 0) {
    missing.push({
      title: "Add a professional headline",
      description: "A concise headline (e.g. 'Full Stack Developer | React & Node.js') gives an instant summary.",
    });
  }

  return missing.slice(0, 3);
};

/**
 * Executes the Weekly Profile Nudge task.
 * Emails candidates whose profile completeness is below 70% and have not been nudged in the last 14 days.
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
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const frontendUrl = env.FRONTEND_URL || env.CLIENT_URL || "http://localhost:3001";

    // 1. Fetch candidate profiles where lastNudgedAt is null or older than 14 days
    const profiles = await CandidateProfile.find({
      $or: [
        { lastNudgedAt: null },
        { lastNudgedAt: { $lt: fourteenDaysAgo } },
      ],
    }).populate({
      path: "user",
      match: {
        role: "candidate",
        isEmailVerified: true,
        status: "active",
        "emailPreferences.profileNudges": { $ne: false },
      },
    });

    const queue = [];

    // 2. Filter profiles with completeness below 70%
    for (const profile of profiles) {
      if (!profile.user) {
        // user suspended, unverified, or opted out
        continue;
      }

      const completeness = calculateCandidateCompleteness(profile);
      if (completeness >= 70) {
        stats.skipped += 1;
        continue;
      }

      const missingItems = getMissingItems(profile);
      if (missingItems.length === 0) {
        stats.skipped += 1;
        continue;
      }

      stats.eligible += 1;
      queue.push({
        profile,
        user: profile.user,
        completeness,
        missingItems,
      });
    }

    // 3. Dry run check
    if (dryRun) {
      note = `Dry run completed. ${stats.eligible} candidates with <70% completeness are eligible for nudges.`;
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
      sendItemFn: async ({ profile, user, completeness, missingItems }) => {
        const unsubscribeToken = generateUnsubscribeToken({
          userId: user._id,
          type: "profileNudges",
        });

        const itemsHtml = missingItems
          .map(
            (item, index) => `
              <div style="background-color: #FFFFFF; border: 1px solid #E8D3AA; border-radius: 8px; padding: 14px 16px; margin-bottom: 10px;">
                <p style="margin: 0 0 4px; font-size: 14px; font-weight: 700; color: #064E3B;">
                  ${index + 1}. ${escapeHtml(item.title)}
                </p>
                <p style="margin: 0; font-size: 13px; color: #6B7280; line-height: 1.4;">
                  ${escapeHtml(item.description)}
                </p>
              </div>
            `
          )
          .join("");

        const bodyHtml = `
          <p style="margin: 0 0 16px;">Hi ${escapeHtml(user.name || "Candidate")},</p>
          <p style="margin: 0 0 16px;">
            Your Career OS profile is currently <strong>${completeness}% complete</strong>. Profiles with at least 70% completion receive significantly more profile views and interview invites from hiring managers.
          </p>

          <div style="margin: 20px 0;">
            <p style="margin: 0 0 10px; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #C8963E;">
              Recommended actions to boost your profile:
            </p>
            ${itemsHtml}
          </div>

          <p style="margin: 0; font-size: 14px; color: #2D3748;">
            Completing these sections takes just 3–5 minutes and directly enhances your automated job matching score.
          </p>
        `;

        const textContent = `Hi ${user.name || "Candidate"},\n\nYour profile is currently ${completeness}% complete. Complete profiles get significantly more recruiter visibility.\n\nRecommended actions:\n${missingItems
          .map((item, idx) => `${idx + 1}. ${item.title}: ${item.description}`)
          .join("\n")}\n\nUpdate your profile now: ${frontendUrl}/candidate/profile`;

        await sendScheduledDigestEmail({
          to: user.email,
          toName: user.name,
          subject: `Career OS: Boost Your Profile to Unlock More Opportunities (${completeness}% Complete)`,
          heading: "Profile Completion Tips",
          bodyHtml,
          textContent,
          ctaText: "Complete Your Profile",
          ctaUrl: `${frontendUrl}/candidate/profile`,
          unsubscribeToken,
          unsubscribeType: "profileNudges",
          footerReason: "You received this email because you opted in to profile tips and nudges.",
        });

        // Update lastNudgedAt on candidate profile
        profile.lastNudgedAt = new Date();
        await profile.save();
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
    console.error(`[profileNudge] Error running task:`, err);
    await finalizeCronLock({
      runDoc: lock.runDoc,
      status: "failed",
      stats,
      error: err.message,
    });
    return { task: TASK_NAME, status: "failed", stats, error: err.message };
  }
};

