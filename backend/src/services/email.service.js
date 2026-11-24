import { env } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";
import {
  incrementDailyEmailCount,
  hasReachedDailyCap,
} from "./emailCap.service.js";
import { renderEmail, escapeHtml } from "./emailLayout.js";

export { escapeHtml };

const BREVO_ENDPOINT = "https://api.brevo.com/v3/smtp/email";
const TIMEOUT_MS = 10_000;

// ── Guard (lazy) ──────────────────────────────────────────────────────────────
const assertConfig = () => {
  if (!env.BREVO_API_KEY || !env.EMAIL_FROM) {
    throw new Error(
      "Email service is not configured. Set BREVO_API_KEY and EMAIL_FROM in .env"
    );
  }
};

// ── Core Send Helper ──────────────────────────────────────────────────────────
/**
 * POST to the Brevo REST API with a 10-second timeout.
 * Accepts both htmlContent and textContent for plain-text multipart support.
 * Throws ApiError(502) on non-2xx responses.
 */
const brevoPost = async ({ sender, to, subject, htmlContent, textContent, headers }) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let res;
  try {
    res = await fetch(BREVO_ENDPOINT, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "api-key": env.BREVO_API_KEY,
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        sender,
        to,
        subject,
        htmlContent,
        textContent,
        ...(headers && { headers }),
      }),
    });
  } catch (err) {
    if (err.name === "AbortError") {
      throw new ApiError(502, "Email service timed out. Please try again.");
    }
    throw new ApiError(502, "Failed to reach the email service. Please try again.");
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    const errBody = await res.text().catch(() => "(unreadable)");
    console.error(`[email.service] Brevo ${res.status}: ${errBody}`);
    throw new ApiError(502, "Email could not be delivered. Please try again later.");
  }

  // Count toward daily email quota
  await incrementDailyEmailCount(to?.length || 1);
};

// ── Public Email APIs ─────────────────────────────────────────────────────────

/**
 * 1. Send OTP verification or password reset email.
 */
export const sendOtpEmail = async (to, otp, purpose) => {
  assertConfig();

  const isReset = purpose === "reset_password";
  const title = isReset ? "Reset Your Password" : "Verify Your Email";
  const preheader = isReset
    ? `Your password reset code is ${otp}. Valid for 5 minutes.`
    : `Your email verification code is ${otp}. Valid for 5 minutes.`;
  const subject = isReset
    ? "Career OS – Password Reset Code"
    : "Career OS – Email Verification Code";

  const frontendUrl = (env.FRONTEND_URL || env.CLIENT_URL || "http://localhost:3001").replace(/\/+$/, "");
  const resetUrl = `${frontendUrl}/reset-password`;

  const bodyHtml = `
    <p style="margin: 0 0 16px 0;">
      ${
        isReset
          ? "We received a request to reset your Career OS account password. Use the verification code below to proceed:"
          : "Welcome to Career OS! Use the verification code below to confirm your email address and activate your account:"
      }
    </p>

    <!-- Large monospaced OTP display block -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 24px 0;">
      <tr>
        <td align="center" style="background-color: #FFFFFF; border: 2px dashed #C8963E; border-radius: 10px; padding: 22px 16px;">
          <span style="font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace; font-size: 34px; font-weight: 700; letter-spacing: 10px; color: #064E3B; display: inline-block;">
            ${escapeHtml(otp)}
          </span>
        </td>
      </tr>
    </table>

    <p style="margin: 0 0 10px 0; font-size: 14px; color: #6B7280;">
      ⏱ This code expires in <strong>5 minutes</strong>.
    </p>
    <p style="margin: 0; font-size: 14px; color: #6B7280;">
      If you did not request this verification code, you can safely ignore this email. Your account remains secure.
    </p>
  `;

  const { html, text } = renderEmail({
    preheader,
    title,
    bodyHtml,
    cta: isReset ? { label: "Reset Password Page", url: resetUrl } : undefined,
    footerNote: "Never share this code with anyone. Career OS staff will never ask for your verification code.",
    reasonText: "You received this operational email because a verification request was initiated for this address.",
  });

  await brevoPost({
    sender: { email: env.EMAIL_FROM, name: "Career OS" },
    to: [{ email: to }],
    subject,
    htmlContent: html,
    textContent: text,
  });
};

/**
 * 2. Send application status update email to candidate.
 */
export const sendApplicationStatusEmail = async (
  to,
  candidateName,
  jobTitle,
  companyName,
  status
) => {
  assertConfig();

  const statusLabel =
    status === "shortlisted"
      ? "Application Shortlisted"
      : status === "hired"
      ? "Congratulations – You're Hired!"
      : "Application Status Update";

  const statusMessage =
    status === "shortlisted"
      ? `Great news! Your application for <strong>${escapeHtml(jobTitle)}</strong> at <strong>${escapeHtml(companyName)}</strong> has been <strong>shortlisted</strong>. The hiring team will be in touch with you regarding next steps.`
      : status === "hired"
      ? `Congratulations! You have been selected and <strong>hired</strong> for the role of <strong>${escapeHtml(jobTitle)}</strong> at <strong>${escapeHtml(companyName)}</strong>!`
      : `Thank you for your interest in <strong>${escapeHtml(jobTitle)}</strong> at <strong>${escapeHtml(companyName)}</strong>. After review, the hiring team has decided not to proceed with your application at this time. We encourage you to keep exploring new opportunities on Career OS.`;

  const title = statusLabel;
  const preheader = `Status update on your application for ${jobTitle} at ${companyName}: ${status.toUpperCase()}`;
  const subject = `Career OS: Application Update for ${jobTitle} at ${companyName} (${status.toUpperCase()})`;
  const frontendUrl = (env.FRONTEND_URL || env.CLIENT_URL || "http://localhost:3001").replace(/\/+$/, "");
  const ctaUrl = `${frontendUrl}/candidate/applications`;

  const bodyHtml = `
    <p style="margin: 0 0 16px 0;">Hi ${escapeHtml(candidateName || "Candidate")},</p>
    <p style="margin: 0 0 20px 0;">${statusMessage}</p>

    <!-- Status Details Card -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #FFFFFF; border: 1px solid #E8D3AA; border-radius: 8px; margin: 20px 0;">
      <tr>
        <td style="padding: 18px 20px;">
          <p style="margin: 0 0 8px 0; font-size: 14px; color: #2D3748;">
            <strong>Role:</strong> ${escapeHtml(jobTitle)}
          </p>
          <p style="margin: 0 0 8px 0; font-size: 14px; color: #2D3748;">
            <strong>Company:</strong> ${escapeHtml(companyName)}
          </p>
          <p style="margin: 0; font-size: 14px; color: #2D3748;">
            <strong>New Status:</strong>
            <span style="display: inline-block; background-color: #FBF3E2; color: #064E3B; font-weight: 600; padding: 2px 10px; border-radius: 4px; text-transform: capitalize; border: 1px solid #E8D3AA;">
              ${escapeHtml(status)}
            </span>
          </p>
        </td>
      </tr>
    </table>
  `;

  const { html, text } = renderEmail({
    preheader,
    title,
    bodyHtml,
    cta: { label: "View Application Status", url: ctaUrl },
    reasonText: "You received this email because you submitted an application on Career OS.",
  });

  await brevoPost({
    sender: { email: env.EMAIL_FROM, name: "Career OS" },
    to: [{ email: to, name: candidateName || "Candidate" }],
    subject,
    htmlContent: html,
    textContent: text,
  });
};

/**
 * 3. Send application confirmation email to candidate.
 */
export const sendApplicationConfirmationEmail = async (
  to,
  candidateName,
  jobTitle,
  companyName
) => {
  assertConfig();

  const title = "Application Submitted Successfully";
  const preheader = `Your application for ${jobTitle} at ${companyName} has been received.`;
  const subject = `Career OS: Application Confirmed for ${jobTitle} at ${companyName}`;
  const frontendUrl = (env.FRONTEND_URL || env.CLIENT_URL || "http://localhost:3001").replace(/\/+$/, "");
  const ctaUrl = `${frontendUrl}/candidate/applications`;

  const bodyHtml = `
    <p style="margin: 0 0 16px 0;">Hi ${escapeHtml(candidateName || "Candidate")},</p>
    <p style="margin: 0 0 20px 0;">
      Your application for <strong>${escapeHtml(jobTitle)}</strong> at <strong>${escapeHtml(companyName)}</strong> has been successfully submitted and delivered to the hiring team.
    </p>

    <!-- Details card -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #FFFFFF; border: 1px solid #E8D3AA; border-radius: 8px; margin: 20px 0;">
      <tr>
        <td style="padding: 18px 20px;">
          <p style="margin: 0 0 8px 0; font-size: 14px; color: #2D3748;">
            <strong>Role:</strong> ${escapeHtml(jobTitle)}
          </p>
          <p style="margin: 0 0 8px 0; font-size: 14px; color: #2D3748;">
            <strong>Company:</strong> ${escapeHtml(companyName)}
          </p>
          <p style="margin: 0; font-size: 14px; color: #2D3748;">
            <strong>Status:</strong>
            <span style="display: inline-block; background-color: #E8F8F2; color: #064E3B; font-weight: 600; padding: 2px 10px; border-radius: 4px; border: 1px solid #10B981;">
              Submitted
            </span>
          </p>
        </td>
      </tr>
    </table>

    <p style="margin: 0; font-size: 14px; color: #6B7280;">
      You will receive an email update whenever the recruiter changes your application status.
    </p>
  `;

  const { html, text } = renderEmail({
    preheader,
    title,
    bodyHtml,
    cta: { label: "Track Your Applications", url: ctaUrl },
    reasonText: "You received this email because you submitted an application on Career OS.",
  });

  await brevoPost({
    sender: { email: env.EMAIL_FROM, name: "Career OS" },
    to: [{ email: to, name: candidateName || "Candidate" }],
    subject,
    htmlContent: html,
    textContent: text,
  });
};

/**
 * 4. Send new applicant alert email to recruiter.
 * NOTE: Candidate's email and phone must NEVER be included here.
 */
export const sendRecruiterNewApplicantEmail = async (
  to,
  recruiterName,
  jobTitle,
  companyName,
  matchScore,
  jobId
) => {
  assertConfig();

  const title = "New Applicant for Your Job Posting";
  const preheader = `A new candidate applied for ${jobTitle} (${matchScore}% skill match).`;
  const subject = `Career OS: New Applicant for ${jobTitle} (${matchScore}% Match)`;
  const frontendUrl = (env.FRONTEND_URL || env.CLIENT_URL || "http://localhost:3001").replace(/\/+$/, "");
  const ctaUrl = `${frontendUrl}/recruiter/jobs/${jobId}/applicants`;

  const bodyHtml = `
    <p style="margin: 0 0 16px 0;">Hi ${escapeHtml(recruiterName || "Recruiter")},</p>
    <p style="margin: 0 0 20px 0;">
      A new candidate has just applied for your open listing <strong>${escapeHtml(jobTitle)}</strong> at <strong>${escapeHtml(companyName)}</strong>.
    </p>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #FFFFFF; border: 1px solid #E8D3AA; border-radius: 8px; margin: 20px 0;">
      <tr>
        <td style="padding: 18px 20px;">
          <p style="margin: 0 0 8px 0; font-size: 14px; color: #2D3748;">
            <strong>Role:</strong> ${escapeHtml(jobTitle)}
          </p>
          <p style="margin: 0 0 8px 0; font-size: 14px; color: #2D3748;">
            <strong>Skill Match Score:</strong>
            <span style="display: inline-block; background-color: #FBF3E2; color: #064E3B; font-weight: 700; padding: 2px 10px; border-radius: 4px; border: 1px solid #C8963E;">
              ${matchScore}%
            </span>
          </p>
          <p style="margin: 0; font-size: 13px; color: #6B7280;">
            Review their verified skills, projects, and structured profile on your recruiter portal.
          </p>
        </td>
      </tr>
    </table>
  `;

  const { html, text } = renderEmail({
    preheader,
    title,
    bodyHtml,
    cta: { label: "Review Applicants", url: ctaUrl },
    reasonText: "You received this email because you posted an active job opening on Career OS.",
  });

  await brevoPost({
    sender: { email: env.EMAIL_FROM, name: "Career OS" },
    to: [{ email: to, name: recruiterName || "Recruiter" }],
    subject,
    htmlContent: html,
    textContent: text,
  });
};

/**
 * 5. Send scheduled digest email (Job digest, recruiter digest, profile nudge, job auto-close, tracker reminders).
 * Uses renderEmail with List-Unsubscribe headers, footer with unsubscribe & preferences links.
 */
export const sendScheduledDigestEmail = async ({
  to,
  toName,
  subject,
  heading,
  preheader,
  bodyHtml,
  textContent,
  ctaText,
  ctaUrl,
  unsubscribeToken,
  unsubscribeType,
  footerReason,
  extraLinks,
}) => {
  assertConfig();

  const frontendUrl = (env.FRONTEND_URL || env.CLIENT_URL || "http://localhost:3001").replace(/\/+$/, "");
  const unsubscribeUrl = unsubscribeToken && unsubscribeType
    ? `${frontendUrl}/unsubscribe?token=${encodeURIComponent(unsubscribeToken)}&type=${encodeURIComponent(unsubscribeType)}`
    : "";

  const reasonText = footerReason || "You received this email based on your Career OS notification preferences.";

  // Sanitize subject: remove any occurrence of "ATS"
  const cleanSubject = String(subject || "").replace(/\bATS\b/gi, "Automated Screening").trim();

  const { html, text } = renderEmail({
    preheader: preheader || heading || cleanSubject,
    title: heading,
    bodyHtml,
    bodyText: textContent,
    cta: ctaText && ctaUrl ? { label: ctaText, url: ctaUrl } : undefined,
    unsubscribeUrl,
    extraLinks,
    reasonText,
  });

  const headers = unsubscribeUrl
    ? {
        "List-Unsubscribe": `<${unsubscribeUrl}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      }
    : undefined;

  await brevoPost({
    sender: { email: env.EMAIL_FROM, name: "Career OS" },
    to: [{ email: to, name: toName || "Career OS User" }],
    subject: cleanSubject,
    htmlContent: html,
    textContent: text,
    ...(headers && { headers }),
  });
};

/**
 * Helper to process batches with concurrency and a delay between batches.
 * Failing emails do not stop the run.
 * Checks daily email cap before each item/batch.
 */
export const sendBatchWithDelay = async ({
  items,
  sendItemFn,
  concurrency = 5,
  delayMs = 300,
  checkCap = true,
}) => {
  const stats = { sent: 0, failed: 0, skipped: 0, capHit: false };

  for (let i = 0; i < items.length; i += concurrency) {
    if (checkCap) {
      const capReached = await hasReachedDailyCap(1);
      if (capReached) {
        stats.capHit = true;
        stats.skipped += items.length - i;
        break;
      }
    }

    const batch = items.slice(i, i + concurrency);
    await Promise.all(
      batch.map(async (item) => {
        try {
          if (checkCap) {
            const reached = await hasReachedDailyCap(1);
            if (reached) {
              stats.capHit = true;
              stats.skipped += 1;
              return;
            }
          }
          await sendItemFn(item);
          stats.sent += 1;
        } catch (err) {
          console.error(`[email.service] Batch item failed:`, err.message);
          stats.failed += 1;
        }
      })
    );

    if (i + concurrency < items.length && delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return stats;
};
