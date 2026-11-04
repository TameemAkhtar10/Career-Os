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

// ── OTP email template ────────────────────────────────────────────────────────
const otpEmailHtml = (otp, purpose) => {
  const isReset = purpose === "reset_password";
  const heading = isReset ? "Reset Your Password" : "Verify Your Email";
  const body = isReset
    ? "Use the OTP below to reset your CareerOS password."
    : "Use the OTP below to verify your CareerOS account.";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${heading}</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:Inter,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0"
               style="background:#ffffff;border-radius:12px;padding:40px;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
          <tr>
            <td>
              <p style="margin:0 0 4px;font-size:13px;color:#6b7280;letter-spacing:1px;text-transform:uppercase;">CareerOS</p>
              <h1 style="margin:0 0 20px;font-size:24px;color:#111827;">${heading}</h1>
              <p style="margin:0 0 28px;font-size:15px;color:#374151;line-height:1.6;">${body}</p>

              <div style="text-align:center;background:#f0f9ff;border:1px solid #bae6fd;
                          border-radius:8px;padding:24px;margin-bottom:28px;">
                <span style="font-size:36px;font-weight:700;letter-spacing:12px;color:#0369a1;">
                  ${otp}
                </span>
              </div>

              <p style="margin:0 0 8px;font-size:13px;color:#6b7280;">
                ⏱ This OTP expires in <strong>5 minutes</strong>.
              </p>
              <p style="margin:0;font-size:13px;color:#6b7280;">
                If you didn't request this, you can safely ignore this email.
              </p>
            </td>
          </tr>
        </table>
        <p style="margin-top:24px;font-size:12px;color:#9ca3af;">© ${new Date().getFullYear()} CareerOS. All rights reserved.</p>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

// ── Core send helper ──────────────────────────────────────────────────────────

/**
 * POST to the Brevo REST API with a 10-second timeout.
 * Throws ApiError(502) on non-2xx responses; logs Brevo's body server-side only.
 */
const brevoPost = async (payload) => {
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
      body: JSON.stringify(payload),
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
    // Log Brevo's error body server-side; never forward to client
    const errBody = await res.text().catch(() => "(unreadable)");
    console.error(`[email.service] Brevo ${res.status}: ${errBody}`);
    throw new ApiError(502, "Email could not be delivered. Please try again later.");
  }
};

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Send an OTP email via Brevo Transactional Email REST API.
 * @param {string} to  - recipient address
 * @param {string|number} otp  - plaintext OTP
 * @param {"verify_email"|"reset_password"} purpose
 */
export const sendOtpEmail = async (to, otp, purpose) => {
  assertConfig();

  const subject =
    purpose === "reset_password"
      ? "CareerOS – Password Reset OTP"
      : "CareerOS – Email Verification OTP";

  await brevoPost({
    sender: { email: env.EMAIL_FROM, name: "Career OS" },
    to: [{ email: to }],
    subject,
    htmlContent: otpEmailHtml(otp, purpose),
  });
};

const applicationStatusEmailHtml = (candidateName, jobTitle, companyName, status) => {
  const statusLabel =
    status === "shortlisted"
      ? "Application Shortlisted"
      : status === "hired"
      ? "Application Accepted 🎉"
      : "Application Status Update";

  const statusMessage =
    status === "shortlisted"
      ? `Great news! Your application for <strong>${jobTitle}</strong> at <strong>${companyName}</strong> has been <strong>shortlisted</strong>. The hiring team will be in touch regarding next steps.`
      : status === "hired"
      ? `Congratulations! You have been selected and <strong>hired</strong> for the role of <strong>${jobTitle}</strong> at <strong>${companyName}</strong>!`
      : `Thank you for your interest in <strong>${jobTitle}</strong> at <strong>${companyName}</strong>. After careful review, the team has decided not to move forward with your application at this time. We encourage you to keep exploring other roles on CareerOS.`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Application Status Update</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:Inter,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0"
               style="background:#ffffff;border-radius:12px;padding:40px;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
          <tr>
            <td>
              <p style="margin:0 0 4px;font-size:13px;color:#6b7280;letter-spacing:1px;text-transform:uppercase;">CareerOS</p>
              <h1 style="margin:0 0 20px;font-size:22px;color:#111827;">${statusLabel}</h1>
              <p style="margin:0 0 16px;font-size:15px;color:#374151;">Hi ${candidateName || "Candidate"},</p>
              <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">${statusMessage}</p>

              <div style="background:#f9fafb;border-radius:8px;padding:16px;margin-bottom:24px;border:1px solid #e5e7eb;">
                <p style="margin:0 0 6px;font-size:14px;color:#4b5563;"><strong>Role:</strong> ${jobTitle}</p>
                <p style="margin:0 0 6px;font-size:14px;color:#4b5563;"><strong>Company:</strong> ${companyName}</p>
                <p style="margin:0;font-size:14px;color:#4b5563;"><strong>New Status:</strong> <span style="text-transform:capitalize;font-weight:600;color:#0284c7;">${status}</span></p>
              </div>

              <p style="margin:0;font-size:13px;color:#6b7280;">Log in to CareerOS anytime to track your applications and check new updates.</p>
            </td>
          </tr>
        </table>
        <p style="margin-top:24px;font-size:12px;color:#9ca3af;">© ${new Date().getFullYear()} CareerOS. All rights reserved.</p>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

/**
 * Send an application status update email via Brevo.
 * @param {string} to  - candidate recipient email
 * @param {string} candidateName
 * @param {string} jobTitle
 * @param {string} companyName
 * @param {"shortlisted"|"rejected"|"hired"} status
 */
export const sendApplicationStatusEmail = async (
  to,
  candidateName,
  jobTitle,
  companyName,
  status
) => {
  assertConfig();

  const subject = `Application Update: ${jobTitle} at ${companyName} (${status.toUpperCase()})`;

  await brevoPost({
    sender: { email: env.EMAIL_FROM, name: "Career OS" },
    to: [{ email: to, name: candidateName || "Candidate" }],
    subject,
    htmlContent: applicationStatusEmailHtml(candidateName, jobTitle, companyName, status),
  });
};

