import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { renderEmail } from "../src/services/emailLayout.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outputDir = path.resolve(__dirname, "../tmp-email-preview");

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const FRONTEND_URL = "https://careeros.in";

const sampleJobRowsHtml = `
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; margin-bottom: 24px;">
    <tr>
      <td style="padding: 16px; background-color: #FFFFFF; border: 1px solid #E8D3AA; border-radius: 8px;">
        <div style="margin-bottom: 6px;">
          <a href="${FRONTEND_URL}/jobs/job-1" target="_blank" style="font-size: 16px; font-weight: 700; color: #064E3B; text-decoration: none; font-family: 'Playfair Display', Georgia, serif;">
            Junior Frontend Developer (React / Next.js)
          </a>
        </div>
        <div style="font-size: 13px; color: #4B5563; margin-bottom: 10px;">
          <strong style="color: #1F2937;">Acme Tech Innovations</strong> • Bengaluru, Karnataka • Full-time
        </div>
        <div>
          <span style="display: inline-block; padding: 3px 8px; font-size: 11px; font-weight: 700; color: #064E3B; background-color: #E6F4EA; border-radius: 9999px; margin-right: 6px;">
            ✦ Fresher Friendly
          </span>
          <span style="font-size: 12px; color: #6B7280;">₹4,50,000 – ₹6,00,000 / yr</span>
        </div>
      </td>
    </tr>
    <tr><td style="height: 10px;"></td></tr>
    <tr>
      <td style="padding: 16px; background-color: #FFFFFF; border: 1px solid #E8D3AA; border-radius: 8px;">
        <div style="margin-bottom: 6px;">
          <a href="${FRONTEND_URL}/jobs/job-2" target="_blank" style="font-size: 16px; font-weight: 700; color: #064E3B; text-decoration: none; font-family: 'Playfair Display', Georgia, serif;">
            Graduate Trainee Software Engineer
          </a>
        </div>
        <div style="font-size: 13px; color: #4B5563; margin-bottom: 10px;">
          <strong style="color: #1F2937;">Infosys Digital Labs</strong> • Pune / Remote • Full-time
        </div>
        <div>
          <span style="display: inline-block; padding: 3px 8px; font-size: 11px; font-weight: 700; color: #064E3B; background-color: #E6F4EA; border-radius: 9999px; margin-right: 6px;">
            ✦ Fresher Friendly
          </span>
          <span style="font-size: 12px; color: #6B7280;">₹5,00,000 / yr</span>
        </div>
      </td>
    </tr>
  </table>
`;

const previews = [
  {
    name: "01-email-verification-otp.html",
    data: {
      preheader: "Your 6-digit verification code for Career OS.",
      title: "Verify your email address",
      bodyHtml: `
        <p style="margin: 0 0 16px;">Welcome to Career OS, Priya! Please use the 6-digit code below to verify your email address.</p>
        <div style="margin: 28px 0; text-align: center;">
          <div style="display: inline-block; font-size: 36px; font-weight: 700; letter-spacing: 10px; color: #064E3B; background-color: #F8E7C9; padding: 16px 28px; border-radius: 8px; border: 1px solid #E8D3AA; font-family: 'Courier New', Courier, monospace;">
            849201
          </div>
          <p style="margin: 12px 0 0; font-size: 13px; color: #6B7280;">This code expires in <strong>5 minutes</strong>.</p>
        </div>
        <p style="margin: 0; font-size: 13px; color: #6B7280;">If you didn't create an account with Career OS, you can safely ignore this email.</p>
      `,
      reasonText: "You received this email because you signed up for Career OS.",
    },
  },
  {
    name: "02-password-reset-otp.html",
    data: {
      preheader: "Reset your Career OS account password.",
      title: "Password reset request",
      bodyHtml: `
        <p style="margin: 0 0 16px;">Hi Priya,</p>
        <p style="margin: 0 0 16px;">We received a request to reset your password. Use the verification code below to proceed.</p>
        <div style="margin: 28px 0; text-align: center;">
          <div style="display: inline-block; font-size: 36px; font-weight: 700; letter-spacing: 10px; color: #064E3B; background-color: #F8E7C9; padding: 16px 28px; border-radius: 8px; border: 1px solid #E8D3AA; font-family: 'Courier New', Courier, monospace;">
            391045
          </div>
          <p style="margin: 12px 0 0; font-size: 13px; color: #6B7280;">Valid for <strong>5 minutes</strong>.</p>
        </div>
        <p style="margin: 0; font-size: 13px; color: #6B7280;">If you did not request a password reset, please secure your account immediately or ignore this message.</p>
      `,
      reasonText: "You received this email because a password reset was requested for your Career OS account.",
    },
  },
  {
    name: "03-application-status-shortlisted.html",
    data: {
      preheader: "Update on your application for Junior Frontend Developer.",
      title: "Application Status Update",
      bodyHtml: `
        <p style="margin: 0 0 16px;">Hi Priya,</p>
        <p style="margin: 0 0 16px;">There is an update on your application for <strong>Junior Frontend Developer</strong> at <strong>Acme Tech Innovations</strong>.</p>
        <div style="margin: 24px 0; padding: 16px 20px; background-color: #FFFFFF; border: 1px solid #E8D3AA; border-radius: 8px;">
          <p style="margin: 0 0 8px; font-size: 12px; font-weight: 700; text-transform: uppercase; color: #6B7280; letter-spacing: 0.05em;">New Status</p>
          <span style="display: inline-block; padding: 6px 14px; font-size: 14px; font-weight: 700; color: #064E3B; background-color: #E6F4EA; border-radius: 9999px;">
            Shortlisted for Screening
          </span>
          <p style="margin: 12px 0 0; font-size: 14px; color: #2D3748; line-height: 1.5;">
            "We were impressed with your React portfolio projects. Our hiring team would like to schedule a 30-minute technical screening call next week."
          </p>
        </div>
      `,
      cta: {
        label: "View Application Status",
        url: `${FRONTEND_URL}/candidate/tracker`,
      },
      reasonText: "You received this email because you applied for a job via Career OS.",
    },
  },
  {
    name: "04-application-submitted-confirmation.html",
    data: {
      preheader: "Application sent for Junior Frontend Developer at Acme Tech Innovations.",
      title: "Application submitted successfully",
      bodyHtml: `
        <p style="margin: 0 0 16px;">Hi Priya,</p>
        <p style="margin: 0 0 16px;">Your application for <strong>Junior Frontend Developer</strong> at <strong>Acme Tech Innovations</strong> has been successfully delivered to the recruiter.</p>
        <div style="margin: 20px 0; padding: 16px; background-color: #FFFFFF; border: 1px solid #E8D3AA; border-radius: 8px; font-size: 14px; color: #2D3748;">
          <p style="margin: 0 0 6px;"><strong>Location:</strong> Bengaluru, Karnataka</p>
          <p style="margin: 0 0 6px;"><strong>Submitted On:</strong> 24 Nov 2026</p>
          <p style="margin: 0;"><strong>Status:</strong> Under Review</p>
        </div>
        <p style="margin: 0; font-size: 14px; color: #4B5563;">You can track this application and log interview rounds anytime in your Career OS Application Tracker.</p>
      `,
      cta: {
        label: "Track in Application Tracker",
        url: `${FRONTEND_URL}/candidate/tracker`,
      },
      reasonText: "You received this confirmation because you applied for a position on Career OS.",
    },
  },
  {
    name: "05-recruiter-new-applicant.html",
    data: {
      preheader: "New application received for Junior Frontend Developer.",
      title: "New candidate application",
      bodyHtml: `
        <p style="margin: 0 0 16px;">Hi Rahul,</p>
        <p style="margin: 0 0 16px;">A candidate has applied for your job posting: <strong>Junior Frontend Developer</strong>.</p>
        <div style="margin: 20px 0; padding: 16px; background-color: #FFFFFF; border: 1px solid #E8D3AA; border-radius: 8px;">
          <p style="margin: 0 0 6px; font-size: 16px; font-weight: 700; color: #064E3B;">Priya Sharma</p>
          <p style="margin: 0 0 8px; font-size: 13px; color: #6B7280;">B.Tech Computer Science (2026 Batch) • 1 Year Experience / Internship</p>
          <div style="font-size: 13px; color: #4B5563;">
            <span style="display: inline-block; padding: 2px 8px; background-color: #F8E7C9; border-radius: 4px; margin-right: 4px; font-size: 11px;">React</span>
            <span style="display: inline-block; padding: 2px 8px; background-color: #F8E7C9; border-radius: 4px; margin-right: 4px; font-size: 11px;">TypeScript</span>
            <span style="display: inline-block; padding: 2px 8px; background-color: #F8E7C9; border-radius: 4px; font-size: 11px;">Next.js</span>
          </div>
        </div>
        <p style="margin: 0; font-size: 13px; color: #6B7280;">Candidate direct contact info is protected until review in the recruiter dashboard.</p>
      `,
      cta: {
        label: "Review Candidate",
        url: `${FRONTEND_URL}/recruiter/dashboard`,
      },
      reasonText: "You received this email because you are a verified recruiter with active listings on Career OS.",
    },
  },
  {
    name: "06-daily-job-digest.html",
    data: {
      preheader: "Fresh entry-level opportunities curated for your profile today.",
      title: "Daily Job Matches",
      bodyHtml: `
        <p style="margin: 0 0 16px;">Hi Priya,</p>
        <p style="margin: 0 0 20px;">Here are today's top fresher-friendly openings matching your skills and preferences:</p>
        ${sampleJobRowsHtml}
        <p style="margin: 0; font-size: 13px; color: #6B7280;">Showing top matches. Click below to view all open fresher roles.</p>
      `,
      cta: {
        label: "View All 18 Matching Jobs",
        url: `${FRONTEND_URL}/jobs?digest=true`,
      },
      unsubscribeUrl: `${FRONTEND_URL}/unsubscribe?token=sample-digest-token&type=jobDigest`,
      reasonText: "You received this email because you opted into daily job match recommendations.",
    },
  },
  {
    name: "07-job-alert.html",
    data: {
      preheader: "New job alerts for 'React Developer' in Bengaluru.",
      title: "Job Alert Matches",
      bodyHtml: `
        <p style="margin: 0 0 16px;">Hi Priya,</p>
        <p style="margin: 0 0 20px;">We found new openings matching your alert <strong>"React Developer in Bengaluru"</strong>:</p>
        ${sampleJobRowsHtml}
      `,
      cta: {
        label: "View All Alert Matches",
        url: `${FRONTEND_URL}/jobs?alert=react-bengaluru`,
      },
      extraLinks: [
        {
          label: "Pause this alert",
          url: `${FRONTEND_URL}/candidate/alerts?pause=react-bengaluru`,
        },
      ],
      unsubscribeUrl: `${FRONTEND_URL}/unsubscribe?token=sample-alert-token&type=jobAlerts`,
      reasonText: "You received this alert based on your saved search preferences.",
    },
  },
  {
    name: "08-profile-completion-nudge.html",
    data: {
      preheader: "Boost your profile from 55% to unlock more fresher-friendly job opportunities.",
      title: "Profile Completion Tips",
      bodyHtml: `
        <p style="margin: 0 0 16px;">Hi Priya,</p>
        <p style="margin: 0 0 16px;">Your Career OS profile is currently <strong>55% complete</strong>. Profiles with at least 70% completion receive significantly more interview invites from hiring managers.</p>
        <div style="margin: 20px 0;">
          <div style="background-color: #FFFFFF; border: 1px solid #E8D3AA; border-radius: 8px; padding: 14px 16px; margin-bottom: 10px;">
            <p style="margin: 0 0 4px; font-size: 14px; font-weight: 700; color: #064E3B;">1. Add at least one Project</p>
            <p style="margin: 0; font-size: 13px; color: #6B7280;">Highlight a portfolio project with GitHub link or live demo to showcase hands-on skills.</p>
          </div>
          <div style="background-color: #FFFFFF; border: 1px solid #E8D3AA; border-radius: 8px; padding: 14px 16px;">
            <p style="margin: 0 0 4px; font-size: 14px; font-weight: 700; color: #064E3B;">2. Verify your Phone Number</p>
            <p style="margin: 0; font-size: 13px; color: #6B7280;">Helps recruiters reach you faster for urgent walk-in interviews and phone screenings.</p>
          </div>
        </div>
      `,
      cta: {
        label: "Complete Your Profile",
        url: `${FRONTEND_URL}/candidate/profile`,
      },
      unsubscribeUrl: `${FRONTEND_URL}/unsubscribe?token=sample-nudge-token&type=profileNudges`,
      reasonText: "You received this email because you opted in to profile tips and nudges.",
    },
  },
  {
    name: "09-tracker-reminder-digest.html",
    data: {
      preheader: "Upcoming interview rounds and follow-ups due today in Career OS.",
      title: "Application Follow-Up Reminders",
      bodyHtml: `
        <p style="margin: 0 0 16px;">Hi Priya,</p>
        <p style="margin: 0 0 20px;">Here is your scheduled summary of application follow-ups and upcoming interviews:</p>
        <div style="margin-bottom: 24px;">
          <div style="padding: 16px; background-color: #FFFFFF; border: 1px solid #E8D3AA; border-radius: 8px; margin-bottom: 10px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <span style="font-size: 15px; font-weight: 700; color: #064E3B;">Junior Frontend Developer</span>
              <span style="display: inline-block; padding: 2px 8px; font-size: 11px; font-weight: 700; color: #064E3B; background-color: #E6F4EA; border-radius: 9999px;">Interview Today</span>
            </div>
            <div style="font-size: 13px; color: #4B5563; margin-bottom: 6px;">Acme Tech Innovations • Screening round with Hiring Manager</div>
            <div style="font-size: 12px; color: #C8963E; font-weight: 600;">Time: Today at 3:30 PM IST</div>
          </div>
          <div style="padding: 16px; background-color: #FFFFFF; border: 1px solid #E8D3AA; border-radius: 8px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <span style="font-size: 15px; font-weight: 700; color: #064E3B;">Graduate Trainee Software Engineer</span>
              <span style="display: inline-block; padding: 2px 8px; font-size: 11px; font-weight: 700; color: #854D0E; background-color: #FEF9C3; border-radius: 9999px;">Follow-up Due</span>
            </div>
            <div style="font-size: 13px; color: #4B5563; margin-bottom: 6px;">Infosys Digital Labs • Applied 14 days ago</div>
            <div style="font-size: 12px; color: #6B7280;">Action: Send a polite follow-up email to HR check on status.</div>
          </div>
        </div>
      `,
      cta: {
        label: "Open Application Tracker",
        url: `${FRONTEND_URL}/candidate/tracker`,
      },
      unsubscribeUrl: `${FRONTEND_URL}/unsubscribe?token=sample-tracker-token&type=trackerReminders`,
      reasonText: "You received this reminder because application reminders are enabled in your account preferences.",
    },
  },
];

console.log(`Generating ${previews.length} email previews in: ${outputDir}`);

for (const preview of previews) {
  const result = renderEmail(preview.data);
  const filePath = path.join(outputDir, preview.name);
  fs.writeFileSync(filePath, result.html, "utf8");
  console.log(`✓ Wrote ${preview.name} (${result.html.length} bytes)`);
}

console.log("All sample email previews generated successfully.");
