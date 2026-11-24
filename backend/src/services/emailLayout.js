import { env } from "../config/env.js";

/**
 * Escapes HTML entities in untrusted dynamic strings.
 */
export const escapeHtml = (str) => {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
};

/**
 * Strips HTML tags and normalizes spaces for clean plain-text parts.
 */
export const htmlToPlainText = (html) => {
  if (!html) return "";
  return String(html)
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<\/div>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<br\s*[\/]?>/gi, "\n")
    .replace(/<\/tr>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#039;/gi, "'")
    .replace(/•\s+/g, "• ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
};

/**
 * Shared, professional, brand-consistent email renderer.
 *
 * @param {Object} options
 * @param {string} [options.preheader] - Inbox preview text
 * @param {string} options.title - H1 title inside card and page title
 * @param {string} options.bodyHtml - Rendered HTML content
 * @param {string} [options.bodyText] - Optional explicit plain text content; derived from bodyHtml if omitted
 * @param {Object} [options.cta] - Optional CTA button { label, url }
 * @param {string} [options.footerNote] - Short specific note before standard footer
 * @param {string} [options.unsubscribeUrl] - Direct one-click or preferences unsubscribe link
 * @param {Array<{ label: string, url: string }>} [options.extraLinks] - Additional footer links (e.g. Pause alert)
 * @param {string} [options.reasonText] - Custom why-you-received-this statement
 * @returns {{ html: string, text: string }}
 */
export const renderEmail = ({
  preheader = "",
  title = "Career OS",
  bodyHtml = "",
  bodyText = "",
  cta,
  footerNote = "",
  unsubscribeUrl = "",
  extraLinks = [],
  reasonText = "You received this email from Career OS according to your account settings and notification preferences.",
} = {}) => {
  const currentYear = new Date().getFullYear();

  // Logo decision: ONLY read process.env.FRONTEND_URL live at call time.
  // Never fall back to the cached env module — that object is frozen at startup
  // and will still hold the .env value even when tests delete process.env.FRONTEND_URL.
  const liveUrl = typeof process.env.FRONTEND_URL === "string"
    ? process.env.FRONTEND_URL.trim()
    : "";               // deleted or never set → treat as absent, no logo

  const logoUrl = liveUrl ? `${liveUrl.replace(/\/+$/, "")}/email/logo.png` : null;

  // For footer links and CTA fall-back text we can be more lenient:
  // prefer the live value, then fall back to other env keys so footer links
  // still resolve in production when only CLIENT_URL is set.
  const frontendUrl = (liveUrl || env.CLIENT_URL || "").replace(/\/+$/, "");

  // Inline SVG logo mark — identical vector paths to Logo.tsx.
  // No external image needed: renders perfectly in all email clients,
  // regardless of whether FRONTEND_URL is set.
  // Ring: white open arc (gap on the right). Arrow: gold diagonal + arrowhead.
  const inlineSvgMark = `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"
       width="36" height="36" style="display:inline-block;vertical-align:middle;" aria-hidden="true">
    <!-- Open ring stroke with gap on the right -->
    <path d="M 35.5 14.4 A 15 15 0 1 0 35.5 33.6"
          fill="none" stroke="#FFF8EC" stroke-width="5" stroke-linecap="round"/>
    <!-- Gold arrow pointing up-right in the gap -->
    <line x1="27" y1="30" x2="37" y2="20"
          stroke="#C8963E" stroke-width="4" stroke-linecap="round"/>
    <polyline points="31,19.5 37,19.5 37,25.5"
              fill="none" stroke="#C8963E" stroke-width="4"
              stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;

  // Header always uses the inline SVG + wordmark — no broken image ever.
  const headerLogoHtml = `<!-- Inline SVG LogoMark + Wordmark -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
      <tr>
        <td valign="middle" style="padding-right: 10px;">
          ${inlineSvgMark}
        </td>
        <td valign="middle">
          <span style="font-family: Georgia, 'Playfair Display', serif; font-size: 22px; font-weight: 700; color: #FFF8EC; letter-spacing: -0.01em; line-height: 1; white-space: nowrap;">Career OS</span>
        </td>
      </tr>
    </table>`;

  // Preheader with whitespace padding to keep inbox previews clean
  const cleanPreheader = escapeHtml(preheader || title);
  const preheaderPadding = "&zwnj;&nbsp;".repeat(30);

  // Bulletproof table-cell CTA Button (Outlook & Gmail safe)
  let ctaButtonHtml = "";
  if (cta && cta.label && cta.url) {
    const safeUrl = escapeHtml(cta.url);
    const safeLabel = escapeHtml(cta.label);
    ctaButtonHtml = `
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin: 28px auto 16px auto;">
        <tr>
          <td align="center" bgcolor="#064E3B" style="border-radius: 8px; border: 1px solid #C8963E; box-shadow: 0 2px 6px rgba(6,78,59,0.25);">
            <!--[if mso]>
            <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${safeUrl}" style="height:44px;v-text-anchor:middle;width:240px;" arcsize="18%" stroke="f" fillcolor="#064E3B">
            <w:anchorlock/>
            <center style="color:#FFF8EC;font-family:Arial,sans-serif;font-size:15px;font-weight:bold;">${safeLabel} &rarr;</center>
            </v:roundrect>
            <![endif]-->
            <!--[if !mso]><!-- -->
            <a href="${safeUrl}" target="_blank"
               style="display: inline-block; background-color: #064E3B; color: #FFF8EC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 15px; font-weight: 600; line-height: 44px; text-align: center; text-decoration: none; padding: 0 28px; -webkit-text-size-adjust: none; mso-hide: all; border-radius: 8px;">
              ${safeLabel} &rarr;
            </a>
            <!--<![endif]-->
          </td>
        </tr>
      </table>
      <p style="margin: 0 0 20px 0; text-align: center; font-size: 12px; line-height: 1.5; color: #6B7280; word-break: break-all;">
        If the button above does not work, copy and paste this link:<br />
        <a href="${safeUrl}" target="_blank" style="color: #064E3B; text-decoration: underline;">${safeUrl}</a>
      </p>
    `;
  }

  // Footer notes and links
  const preferencesUrl = `${frontendUrl}/account`;
  const websiteUrl = frontendUrl || "https://careeros.in";

  const footerLinksList = [];
  if (unsubscribeUrl) {
    footerLinksList.push(`<a href="${escapeHtml(unsubscribeUrl)}" target="_blank" style="color: #064E3B; text-decoration: underline; font-weight: 500;">Unsubscribe</a>`);
  }
  footerLinksList.push(`<a href="${escapeHtml(preferencesUrl)}" target="_blank" style="color: #064E3B; text-decoration: underline; font-weight: 500;">Manage email preferences</a>`);
  if (Array.isArray(extraLinks) && extraLinks.length > 0) {
    for (const link of extraLinks) {
      if (link && link.label && link.url) {
        footerLinksList.push(`<a href="${escapeHtml(link.url)}" target="_blank" style="color: #C8963E; text-decoration: underline; font-weight: 600;">${escapeHtml(link.label)}</a>`);
      }
    }
  }
  footerLinksList.push(`<a href="${escapeHtml(websiteUrl)}" target="_blank" style="color: #064E3B; text-decoration: underline; font-weight: 500;">Visit Career OS</a>`);

  const footerHtml = `
    ${footerNote ? `<p style="margin: 0 0 12px 0; font-size: 12px; line-height: 1.5; color: #6B7280;">${escapeHtml(footerNote)}</p>` : ""}
    <p style="margin: 0 0 10px 0; font-size: 12px; line-height: 1.6; color: #6B7280;">
      ${escapeHtml(reasonText)}
    </p>
    <p style="margin: 0 0 14px 0; font-size: 12px; line-height: 1.8; color: #6B7280;">
      ${footerLinksList.join(' &nbsp;&bull;&nbsp; ')}
    </p>
    <p style="margin: 12px 0 0 0; font-size: 11px; line-height: 1.5; color: #9CA3AF;">
      &copy; ${currentYear} Career OS &bull; Jobs that welcome freshers &bull; All rights reserved.
    </p>
  `;

  const html = `<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="color-scheme" content="light dark" />
  <meta name="supported-color-schemes" content="light dark" />
  <title>${escapeHtml(title)}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    :root {
      color-scheme: light dark;
      supported-color-schemes: light dark;
    }
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    table { border-collapse: collapse !important; }
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; }
    a[x-apple-data-detectors] {
      color: inherit !important;
      text-decoration: none !important;
      font-size: inherit !important;
      font-family: inherit !important;
      font-weight: inherit !important;
      line-height: inherit !important;
    }
    @media only screen and (max-width: 600px) {
      .email-container { width: 100% !important; max-width: 100% !important; }
      .email-card { padding: 24px 18px !important; }
      .header-pad { padding: 16px 18px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #F8E7C9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #2D3748; -webkit-font-smoothing: antialiased;">
  <!-- Hidden Preheader Preview Text -->
  <div style="display: none; font-size: 1px; color: #F8E7C9; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all;">
    ${cleanPreheader} ${preheaderPadding}
  </div>

  <!-- Outer Background Table -->
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #F8E7C9; margin: 0; padding: 32px 12px 48px 12px;">
    <tr>
      <td align="center" valign="top">
        <!-- Container Table: 600px Max -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" class="email-container" style="max-width: 600px; margin: 0 auto;">
          
          <!-- Solid Header Band -->
          <tr>
            <td align="left" class="header-pad" style="background-color: #064E3B; padding: 20px 28px; border-radius: 12px 12px 0 0;">
              ${headerLogoHtml}
            </td>
          </tr>

          <!-- Gold Accent Line -->
          <tr>
            <td height="3" style="background-color: #C8963E; line-height: 3px; font-size: 3px; mso-line-height-rule: exactly;">&nbsp;</td>
          </tr>

          <!-- Main Content Card -->
          <tr>
            <td class="email-card" style="background-color: #FFF8EC; padding: 36px 36px 32px 36px; border-left: 1px solid #E8D3AA; border-right: 1px solid #E8D3AA; border-bottom: 1px solid #E8D3AA; border-radius: 0 0 12px 12px; box-shadow: 0 4px 18px rgba(6,78,59,0.06);">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td>
                    <h1 style="margin: 0 0 18px 0; font-family: Georgia, 'Playfair Display', serif; font-size: 22px; font-weight: 700; color: #064E3B; line-height: 1.35; letter-spacing: -0.01em;">
                      ${escapeHtml(title)}
                    </h1>

                    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #2D3748;">
                      ${bodyHtml}
                    </div>

                    ${ctaButtonHtml}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Brand Footer -->
          <tr>
            <td style="padding: 24px 16px 0 16px; text-align: center;">
              ${footerHtml}
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  // Render plain-text alternative
  const plainBody = bodyText || htmlToPlainText(bodyHtml);
  let text = `${title}\n${"=".repeat(title.length)}\n\n`;
  if (preheader && preheader !== title) {
    text += `${preheader}\n\n`;
  }
  text += `${plainBody}\n\n`;

  if (cta && cta.label && cta.url) {
    text += `${cta.label}: ${cta.url}\n\n`;
  }

  if (footerNote) {
    text += `${footerNote}\n\n`;
  }

  text += `--------------------------------------------------\n`;
  text += `${reasonText}\n\n`;

  if (unsubscribeUrl) {
    text += `Unsubscribe: ${unsubscribeUrl}\n`;
  }
  text += `Manage email preferences: ${preferencesUrl}\n`;
  if (Array.isArray(extraLinks) && extraLinks.length > 0) {
    for (const link of extraLinks) {
      if (link?.label && link?.url) {
        text += `${link.label}: ${link.url}\n`;
      }
    }
  }
  text += `Website: ${websiteUrl}\n\n`;
  text += `© ${currentYear} Career OS • Jobs that welcome freshers • All rights reserved.`;

  return { html, text };
};
