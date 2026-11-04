import { env } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";

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

// ── HTML Escaper ──────────────────────────────────────────────────────────────
export const escapeHtml = (str) => {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

// ── Shared Branded Email Layout ───────────────────────────────────────────────
/**
 * Renders a responsive, branded HTML email using the Career OS design system:
 * Emerald Ink #064E3B, Champagne #F8E7C9, Cream #FFF8EC, Gold #C8963E.
 */
const renderBrandedEmail = ({ title, heading, bodyHtml, ctaText, ctaUrl, footerNote }) => {
  const currentYear = new Date().getFullYear();
  const ctaButtonHtml = ctaUrl && ctaText
    ? `
      <div style="margin: 28px 0; text-align: center;">
        <a href="${escapeHtml(ctaUrl)}"
           style="display: inline-block; background-color: #064E3B; color: #FFF8EC; font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; font-weight: 600; text-decoration: none; padding: 13px 28px; border-radius: 8px; border: 1px solid #C8963E; box-shadow: 0 2px 4px rgba(6, 78, 59, 0.15);">
          ${escapeHtml(ctaText)} &rarr;
        </a>
      </div>
    `
    : "";

  const footerExtra = footerNote
    ? `<p style="margin: 16px 0 0; font-size: 12px; line-height: 1.5; color: #6B7280;">${escapeHtml(footerNote)}</p>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${escapeHtml(title || heading)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F8E7C9; font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #2D3748;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #F8E7C9; padding: 40px 16px;">
    <tr>
      <td align="center">
        <!-- Brand Header -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 540px; margin-bottom: 20px;">
          <tr>
            <td align="center">
              <span style="font-family: Fraunces, Georgia, serif; font-size: 24px; font-weight: 700; color: #064E3B; letter-spacing: -0.02em;">
                Career OS
              </span>
            </td>
          </tr>
        </table>

        <!-- Main Card -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0"
               style="max-width: 540px; background-color: #FFF8EC; border: 1px solid #E8D3AA; border-radius: 14px; padding: 36px 32px; box-shadow: 0 4px 20px rgba(6, 78, 59, 0.06);">
          <tr>
            <td>
              <h1 style="margin: 0 0 16px; font-family: Fraunces, Georgia, serif; font-size: 22px; font-weight: 700; color: #064E3B; line-height: 1.3;">
                ${escapeHtml(heading)}
              </h1>

              <div style="font-size: 15px; line-height: 1.6; color: #2D3748;">
                ${bodyHtml}
              </div>

              ${ctaButtonHtml}
              ${footerExtra}
            </td>
          </tr>
        </table>

        <!-- Footer -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 540px; margin-top: 24px; text-align: center;">
          <tr>
            <td>
              <p style="margin: 0; font-size: 12px; color: #6B7280;">
                &copy; ${currentYear} Career OS &bull; The Operating System for Careers &bull; All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

// ── Core Send Helper ──────────────────────────────────────────────────────────
/**
 * POST to the Brevo REST API with a 10-second timeout.
 * Accepts both htmlContent and textContent for plain-text fallback.
 * Throws ApiError(502) on non-2xx responses.
 */
const brevoPost = async ({ sender, to, subject, htmlContent, textContent }) => {
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
};

// ── Public Email APIs ─────────────────────────────────────────────────────────

/**
 * 1. Send OTP verification or password reset email.
 */
export const sendOtpEmail = async (to, otp, purpose) => {
  assertConfig();

  const isReset = purpose === "reset_password";
  const heading = isReset ? "Reset Your Password" : "Verify Your Email";
  const subject = isReset
    ? "Career OS – Password Reset Code"
    : "Career OS – Email Verification Code";

  const bodyHtml = `
    <p style="margin: 0 0 16px;">
      ${isReset
        ? "We received a request to reset your Career OS account password. Use the verification code below to proceed:"
        : "Welcome to Career OS! Use the verification code below to verify your email address:"}
    </p>

    <div style="text-align: center; background-color: #FFFFFF; border: 2px dashed #C8963E; border-radius: 10px; padding: 20px; margin: 24px 0;">
      <span style="font-family: 'Plus Jakarta Sans', monospace; font-size: 32px; font-weight: 700; letter-spacing: 10px; color: #064E3B;">
        ${escapeHtml(otp)}
      </span>
    </div>

    <p style="margin: 0 0 8px; font-size: 13px; color: #6B7280;">
      ⏱ This code expires in <strong>5 minutes</strong>.
    </p>
    <p style="margin: 0; font-size: 13px; color: #6B7280;">
      If you did not request this code, you can safely ignore this email.
    </p>
  `;

  const textContent = `${heading}\n\n${
    isReset
      ? "Use the code below to reset your Career OS account password:"
      : "Use the code below to verify your email address on Career OS:"
  }\n\nOTP Code: ${otp}\n\nThis code expires in 5 minutes. If you did not request this, you can safely ignore this email.\n\n© Career OS`;

  await brevoPost({
    sender: { email: env.EMAIL_FROM, name: "Career OS" },
    to: [{ email: to }],
    subject,
    htmlContent: renderBrandedEmail({
      title: heading,
      heading,
      bodyHtml,
    }),
    textContent,
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
      ? "Congratulations – You're Hired! 🎉"
      : "Application Status Update";

  const statusMessage =
    status === "shortlisted"
      ? `Great news! Your application for <strong>${escapeHtml(jobTitle)}</strong> at <strong>${escapeHtml(companyName)}</strong> has been <strong>shortlisted</strong>. The hiring team will be in touch with you regarding next steps.`
      : status === "hired"
      ? `Congratulations! You have been selected and <strong>hired</strong> for the role of <strong>${escapeHtml(jobTitle)}</strong> at <strong>${escapeHtml(companyName)}</strong>!`
      : `Thank you for your interest in <strong>${escapeHtml(jobTitle)}</strong> at <strong>${escapeHtml(companyName)}</strong>. After careful review, the hiring team has decided not to proceed with your application at this time. We encourage you to keep exploring new opportunities on Career OS.`;

  const heading = statusLabel;
  const subject = `Career OS: Application Update for ${jobTitle} at ${companyName} (${status.toUpperCase()})`;
  const frontendUrl = env.FRONTEND_URL || env.CLIENT_URL || "http://localhost:3001";
  const ctaUrl = `${frontendUrl}/candidate/applications`;

  const bodyHtml = `
    <p style="margin: 0 0 16px;">Hi ${escapeHtml(candidateName || "Candidate")},</p>
    <p style="margin: 0 0 20px;">${statusMessage}</p>

    <div style="background-color: #FFFFFF; border: 1px solid #E8D3AA; border-radius: 8px; padding: 18px; margin: 20px 0;">
      <p style="margin: 0 0 8px; font-size: 14px; color: #2D3748;"><strong>Role:</strong> ${escapeHtml(jobTitle)}</p>
      <p style="margin: 0 0 8px; font-size: 14px; color: #2D3748;"><strong>Company:</strong> ${escapeHtml(companyName)}</p>
      <p style="margin: 0; font-size: 14px; color: #2D3748;">
        <strong>New Status:</strong>
        <span style="display: inline-block; background-color: #FBF3E2; color: #064E3B; font-weight: 600; padding: 2px 8px; border-radius: 4px; text-transform: capitalize; border: 1px solid #E8D3AA;">
          ${escapeHtml(status)}
        </span>
      </p>
    </div>
  `;

  const textContent = `Hi ${candidateName || "Candidate"},\n\n${
    status === "shortlisted"
      ? `Great news! Your application for ${jobTitle} at ${companyName} has been shortlisted.`
      : status === "hired"
      ? `Congratulations! You have been hired for ${jobTitle} at ${companyName}!`
      : `Thank you for your interest in ${jobTitle} at ${companyName}. The hiring team has decided not to move forward at this time.`
  }\n\nRole: ${jobTitle}\nCompany: ${companyName}\nStatus: ${status}\n\nView your applications: ${ctaUrl}\n\n© Career OS`;

  await brevoPost({
    sender: { email: env.EMAIL_FROM, name: "Career OS" },
    to: [{ email: to, name: candidateName || "Candidate" }],
    subject,
    htmlContent: renderBrandedEmail({
      title: heading,
      heading,
      bodyHtml,
      ctaText: "View Application Status",
      ctaUrl,
    }),
    textContent,
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

  const heading = "Application Submitted Successfully";
  const subject = `Career OS: Application Confirmed for ${jobTitle} at ${companyName}`;
  const frontendUrl = env.FRONTEND_URL || env.CLIENT_URL || "http://localhost:3001";
  const ctaUrl = `${frontendUrl}/candidate/applications`;

  const bodyHtml = `
    <p style="margin: 0 0 16px;">Hi ${escapeHtml(candidateName || "Candidate")},</p>
    <p style="margin: 0 0 20px;">
      Your application for <strong>${escapeHtml(jobTitle)}</strong> at <strong>${escapeHtml(companyName)}</strong> has been successfully submitted.
    </p>

    <div style="background-color: #FFFFFF; border: 1px solid #E8D3AA; border-radius: 8px; padding: 18px; margin: 20px 0;">
      <p style="margin: 0 0 8px; font-size: 14px; color: #2D3748;"><strong>Role:</strong> ${escapeHtml(jobTitle)}</p>
      <p style="margin: 0 0 8px; font-size: 14px; color: #2D3748;"><strong>Company:</strong> ${escapeHtml(companyName)}</p>
      <p style="margin: 0; font-size: 14px; color: #2D3748;">
        <strong>Status:</strong>
        <span style="display: inline-block; background-color: #E8F8F2; color: #064E3B; font-weight: 600; padding: 2px 8px; border-radius: 4px; border: 1px solid #10B981;">
          Submitted
        </span>
      </p>
    </div>

    <p style="margin: 0; font-size: 14px; color: #6B7280;">
      You will receive an email update whenever the recruiter changes your application status.
    </p>
  `;

  const textContent = `Hi ${candidateName || "Candidate"},\n\nYour application for ${jobTitle} at ${companyName} has been successfully submitted.\n\nRole: ${jobTitle}\nCompany: ${companyName}\nStatus: Submitted\n\nTrack your applications: ${ctaUrl}\n\n© Career OS`;

  await brevoPost({
    sender: { email: env.EMAIL_FROM, name: "Career OS" },
    to: [{ email: to, name: candidateName || "Candidate" }],
    subject,
    htmlContent: renderBrandedEmail({
      title: heading,
      heading,
      bodyHtml,
      ctaText: "Track Your Applications",
      ctaUrl,
    }),
    textContent,
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

  const heading = "New Applicant for Your Job Posting";
  const subject = `Career OS: New Applicant for ${jobTitle} (${matchScore}% Match)`;
  const frontendUrl = env.FRONTEND_URL || env.CLIENT_URL || "http://localhost:3001";
  const ctaUrl = `${frontendUrl}/recruiter/jobs/${jobId}/applicants`;

  const bodyHtml = `
    <p style="margin: 0 0 16px;">Hi ${escapeHtml(recruiterName || "Recruiter")},</p>
    <p style="margin: 0 0 20px;">
      A new candidate has just applied for your open listing <strong>${escapeHtml(jobTitle)}</strong> at <strong>${escapeHtml(companyName)}</strong>.
    </p>

    <div style="background-color: #FFFFFF; border: 1px solid #E8D3AA; border-radius: 8px; padding: 18px; margin: 20px 0;">
      <p style="margin: 0 0 8px; font-size: 14px; color: #2D3748;"><strong>Role:</strong> ${escapeHtml(jobTitle)}</p>
      <p style="margin: 0 0 8px; font-size: 14px; color: #2D3748;">
        <strong>Skill Match Score:</strong>
        <span style="display: inline-block; background-color: #FBF3E2; color: #064E3B; font-weight: 700; padding: 2px 8px; border-radius: 4px; border: 1px solid #C8963E;">
          ${matchScore}%
        </span>
      </p>
      <p style="margin: 0; font-size: 13px; color: #6B7280;">
        Review their skills, experience, and profile on your recruiter dashboard.
      </p>
    </div>
  `;

  const textContent = `Hi ${recruiterName || "Recruiter"},\n\nA new candidate has applied for your job: ${jobTitle} at ${companyName}.\n\nSkill Match Score: ${matchScore}%\n\nReview the applicant on your dashboard: ${ctaUrl}\n\n© Career OS`;

  await brevoPost({
    sender: { email: env.EMAIL_FROM, name: "Career OS" },
    to: [{ email: to, name: recruiterName || "Recruiter" }],
    subject,
    htmlContent: renderBrandedEmail({
      title: heading,
      heading,
      bodyHtml,
      ctaText: "Review Applicants",
      ctaUrl,
    }),
    textContent,
  });
};
