/* 
  NOTE FOR LEGAL REVIEW:
  This is a plain-English draft reflecting actual Career OS technical and operational architecture.
  Review with qualified legal counsel prior to commercial launch.
*/

import React from "react";
import Link from "next/link";
import { Card } from "../../../components/ui/Card";
import { ROUTES } from "../../../constants/routes";
import { Shield, Lock, Eye, Download, Trash2, Mail, Cookie } from "lucide-react";

export const PrivacyPage: React.FC = () => {
  const lastUpdated = "November 10, 2026";

  return (
    <div className="min-h-screen bg-champagne/40 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-badge bg-champagne border border-border text-emerald text-xs font-semibold">
            <Shield className="w-3.5 h-3.5 text-gold" />
            <span>Data Protection</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-emerald-dark tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-xs sm:text-sm text-muted">
            Last updated: <span className="text-body font-medium">{lastUpdated}</span>
          </p>
        </div>

        {/* Introduction */}
        <Card className="p-6 sm:p-8 bg-cream border-border shadow-emerald-sm space-y-4">
          <h2 className="font-display text-xl font-bold text-emerald-dark">
            1. Our Commitment to Your Privacy
          </h2>
          <p className="text-sm text-body/80 leading-relaxed">
            At Career OS, we believe career platforms should respect user ownership and minimize data
            collection. This Privacy Policy details how we handle your personal data across account
            creation, resume handling, job applications, and notification delivery.
          </p>
          <p className="text-sm text-body/80 leading-relaxed font-medium text-emerald">
            We never sell your personal data or resume to advertisers or third-party data brokers.
          </p>
        </Card>

        {/* Data We Collect */}
        <Card className="p-6 sm:p-8 bg-cream border-border shadow-emerald-sm space-y-4">
          <div className="flex items-center gap-2 text-emerald">
            <Lock className="w-5 h-5 text-gold" />
            <h2 className="font-display text-xl font-bold text-emerald-dark">
              2. Information We Collect &amp; Store
            </h2>
          </div>
          <div className="space-y-4 text-sm text-body/80 leading-relaxed">
            <div>
              <h3 className="font-semibold text-emerald-dark mb-1">A. Account Credentials</h3>
              <p>
                When registering, we collect your name, email address, chosen password, and assigned role
                (<code className="text-xs bg-champagne px-1.5 py-0.5 rounded text-emerald">candidate</code> or{" "}
                <code className="text-xs bg-champagne px-1.5 py-0.5 rounded text-emerald">recruiter</code>).
                Passwords are one-way hashed with bcrypt (cost factor 12) before database insertion and are
                never stored in plain text.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-emerald-dark mb-1">B. Candidate Profiles &amp; Resumes</h3>
              <p>
                Candidates may optionally add headline, biography, target phone number, location, degree
                records, skill tags, project details, and external portfolio links (GitHub, LinkedIn).
                PDF resumes uploaded to the platform are stored securely using cloud storage and are only
                retrieved when you view them or when an authorized recruiter evaluates your active application.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-emerald-dark mb-1">C. Optional AI Resume Analysis</h3>
              <p>
                When candidates choose to run the optional AI Resume Score Checker, your resume is first strictly
                redacted on our servers before any third-party transmission. Your name, email address, phone numbers,
                all personal URLs (LinkedIn, GitHub), and street addresses are removed. Only this anonymized text is
                sent to a third-party AI provider (currently Groq) to generate formatting structure tips and bullet point suggestions.
                We never store raw resume text in the analysis database; only calculated scores, keyword presence lists,
                and recommendations are retained for your private viewing. You may withdraw your AI consent at any time
                from the Resume Checker history panel or permanently delete individual analyses or your entire account.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-emerald-dark mb-1">C. Recruiter &amp; Job Posting Data</h3>
              <p>
                Recruiters provide organization name, optional logo, website URL, and opening specifications
                (title, requirements, work mode, salary visibility, and application deadline).
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-emerald-dark mb-1">D. Application History</h3>
              <p>
                We log timestamps, status transitions (<code className="text-xs bg-champagne px-1 py-0.5 rounded text-emerald">applied</code>, <code className="text-xs bg-champagne px-1 py-0.5 rounded text-emerald">shortlisted</code>, <code className="text-xs bg-champagne px-1 py-0.5 rounded text-emerald">rejected</code>, <code className="text-xs bg-champagne px-1 py-0.5 rounded text-emerald">hired</code>), cover notes, and computed skill match scores.
              </p>
            </div>
          </div>
        </Card>

        {/* How We Share Data */}
        <Card className="p-6 sm:p-8 bg-cream border-border shadow-emerald-sm space-y-4">
          <div className="flex items-center gap-2 text-emerald">
            <Eye className="w-5 h-5 text-gold" />
            <h2 className="font-display text-xl font-bold text-emerald-dark">
              3. Who Can See Your Information?
            </h2>
          </div>
          <div className="space-y-3 text-sm text-body/80 leading-relaxed">
            <p>
              <strong>Strict Applicant-Only Recruiter Access:</strong> Recruiters can <em>only</em> access the
              profile, contact details, and resume of candidates who have actively submitted an application
              for their specific job opening. We do not provide a searchable public directory of candidate resumes.
            </p>
            <p>
              <strong>Open To Work Setting:</strong> Candidates can toggle their availability status in their
              profile. When set to inactive, candidate profiles are paused from automated job recommendation digests.
            </p>
            <p>
              <strong>Recruiter Digest Privacy:</strong> Daily applicant digest emails sent to recruiters summarize
              applicant counts and job titles only; candidate names, phone numbers, and email addresses are
              never placed in digest emails.
            </p>
          </div>
        </Card>

        {/* Authentication & Cookies */}
        <Card className="p-6 sm:p-8 bg-cream border-border shadow-emerald-sm space-y-4">
          <div className="flex items-center gap-2 text-emerald">
            <Cookie className="w-5 h-5 text-gold" />
            <h2 className="font-display text-xl font-bold text-emerald-dark">
              4. Cookies &amp; Session Management
            </h2>
          </div>
          <p className="text-sm text-body/80 leading-relaxed">
            We do not use third-party tracking cookies or advertising pixels. We use strictly necessary,
            cryptographically signed, <code className="text-xs bg-champagne px-1.5 py-0.5 rounded text-emerald font-mono">httpOnly</code> cookies for user session authentication. These cookies cannot be read by browser-side JavaScript, protecting your account against cross-site scripting (XSS) extraction.
          </p>
        </Card>

        {/* Email Communications */}
        <Card className="p-6 sm:p-8 bg-cream border-border shadow-emerald-sm space-y-4">
          <div className="flex items-center gap-2 text-emerald">
            <Mail className="w-5 h-5 text-gold" />
            <h2 className="font-display text-xl font-bold text-emerald-dark">
              5. Emails &amp; Notification Controls
            </h2>
          </div>
          <div className="space-y-3 text-sm text-body/80 leading-relaxed">
            <p>We deliver transactional and digest emails through a dedicated email delivery service:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                <strong>Transactional Emails:</strong> Email verification codes (OTP), password reset links,
                application confirmation notices, and application status updates.
              </li>
              <li>
                <strong>Scheduled Digests:</strong> Daily job alerts for candidates, daily applicant digests
                for recruiters, and weekly profile completion nudges.
              </li>
            </ul>
            <p>
              <strong>Unsubscribe &amp; Preferences:</strong> Every scheduled email features a signed 1-click
              unsubscribe link conforming to RFC 8058 (<code className="text-xs bg-champagne px-1 py-0.5 rounded text-emerald">List-Unsubscribe</code>). You can also configure individual email alerts at any time on your{" "}
              <Link href={ROUTES.ACCOUNT} className="text-emerald font-semibold underline hover:text-gold transition-colors">
                Account Settings
              </Link>{" "}
              page.
            </p>
          </div>
        </Card>

        {/* Data Export & Deletion */}
        <Card className="p-6 sm:p-8 bg-cream border-border shadow-emerald-sm space-y-4">
          <div className="flex items-center gap-2 text-emerald">
            <Download className="w-5 h-5 text-gold" />
            <h2 className="font-display text-xl font-bold text-emerald-dark">
              6. Your Data Rights: Export &amp; Permanent Deletion
            </h2>
          </div>
          <p className="text-sm text-body/80 leading-relaxed">
            You hold complete ownership and control over your data on Career OS:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-champagne/30 border border-border space-y-2">
              <div className="flex items-center gap-2 text-emerald-dark font-semibold text-sm">
                <Download className="w-4 h-4 text-gold" />
                Data Portability (Export)
              </div>
              <p className="text-xs text-body/70 leading-relaxed">
                Download a complete, machine-readable JSON archive of all your personal data, profile
                information, and application history directly from your account.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-champagne/30 border border-border space-y-2">
              <div className="flex items-center gap-2 text-error font-semibold text-sm">
                <Trash2 className="w-4 h-4" />
                Right to Erasure (Deletion)
              </div>
              <p className="text-xs text-body/70 leading-relaxed">
                Permanently purge your account. Upon confirming your password in Account Settings, your
                profile records, resume files, and authentication tokens are irreversibly deleted from our servers.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

