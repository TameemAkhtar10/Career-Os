/* 
  NOTE FOR LEGAL REVIEW:
  This is a plain-English draft reflecting actual Career OS technical and operational architecture.
  Review with qualified legal counsel prior to commercial launch.
*/

import React from "react";
import Link from "next/link";
import { Card } from "../../../components/ui/Card";
import { ROUTES } from "../../../constants/routes";
import { ShieldCheck, Scale, FileText, AlertCircle, Ban, CheckCircle } from "lucide-react";

export const TermsPage: React.FC = () => {
  const lastUpdated = "November 9, 2026";

  return (
    <div className="min-h-screen bg-champagne/40 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-badge bg-champagne border border-border text-emerald text-xs font-semibold">
            <Scale className="w-3.5 h-3.5 text-gold" />
            <span>Legal Agreement</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-emerald-dark tracking-tight">
            Terms of Service
          </h1>
          <p className="text-xs sm:text-sm text-muted">
            Last updated: <span className="text-body font-medium">{lastUpdated}</span>
          </p>
        </div>

        {/* Intro Card */}
        <Card className="p-6 sm:p-8 bg-cream border-border shadow-emerald-sm space-y-4">
          <h2 className="font-display text-xl font-bold text-emerald-dark">
            1. Overview &amp; Acceptance
          </h2>
          <p className="text-sm text-body/80 leading-relaxed">
            Welcome to Career OS (&quot;we&quot;, &quot;our&quot;, or &quot;the platform&quot;). Career OS is a recruitment
            platform designed to connect emerging candidates with verified employers and recruiters.
            By creating an account, accessing, or utilizing our services, you agree to comply with and
            be bound by these Terms of Service and our{" "}
            <Link href={ROUTES.PRIVACY} className="text-emerald font-semibold underline hover:text-gold transition-colors">
              Privacy Policy
            </Link>
            .
          </p>
          <p className="text-sm text-body/80 leading-relaxed">
            If you do not agree with any part of these terms, you must discontinue use and may delete
            your account anytime from your{" "}
            <Link href={ROUTES.ACCOUNT} className="text-emerald font-semibold underline hover:text-gold transition-colors">
              Account Settings
            </Link>
            .
          </p>
        </Card>

        {/* Accounts & Auth */}
        <Card className="p-6 sm:p-8 bg-cream border-border shadow-emerald-sm space-y-4">
          <h2 className="font-display text-xl font-bold text-emerald-dark">
            2. Accounts, Authentication &amp; Security
          </h2>
          <div className="space-y-3 text-sm text-body/80 leading-relaxed">
            <p>
              <strong>Email Verification &amp; One-Time Passwords (OTP):</strong> To maintain authentic user
              records, email addresses must be verified via single-use numeric codes that expire within
              5 minutes. You are responsible for maintaining control of your registered email account.
            </p>
            <p>
              <strong>Session Security:</strong> We utilize secure, <code className="text-xs bg-champagne px-1.5 py-0.5 rounded text-emerald font-mono">httpOnly</code> cookies for access authentication and refresh token rotation. You must not attempt to intercept, forge, or replay authentication tokens.
            </p>
            <p>
              <strong>Single User Accounts:</strong> Accounts are non-transferable. You are responsible for
              all actions taken under your credentials. Notify us immediately if you suspect unauthorized access.
            </p>
          </div>
        </Card>

        {/* Candidate Terms */}
        <Card className="p-6 sm:p-8 bg-cream border-border shadow-emerald-sm space-y-4">
          <div className="flex items-center gap-2 text-emerald">
            <CheckCircle className="w-5 h-5 text-gold" />
            <h2 className="font-display text-xl font-bold text-emerald-dark">
              3. Candidate Profiles, Resumes &amp; Applications
            </h2>
          </div>
          <div className="space-y-3 text-sm text-body/80 leading-relaxed">
            <p>
              <strong>Accuracy of Profile Data:</strong> Candidates must provide truthful, current information
              regarding their education, experience, skills, and project links. Misrepresenting degrees,
              identity, or credentials violates these terms.
            </p>
            <p>
              <strong>Resume Uploads:</strong> PDF resumes uploaded to Career OS are stored in secure cloud
              storage. You retain full intellectual ownership of your resume and uploaded content.
            </p>
            <p>
              <strong>Recruiter Visibility:</strong> Your resume and contact information are <em>only</em> shared
              with hiring teams when you explicitly submit an application for their posted opening. We do not
              sell candidate records or expose candidate contact information to unauthorized third parties.
            </p>
            <p>
              <strong>Applications &amp; Status Tracking:</strong> Submitting an application transmits your
              application profile, cover note, and resume to the recruiting organization. You may track
              the lifecycle of each submission (<code className="text-xs bg-champagne px-1 py-0.5 rounded text-emerald">applied</code>, <code className="text-xs bg-champagne px-1 py-0.5 rounded text-emerald">shortlisted</code>, <code className="text-xs bg-champagne px-1 py-0.5 rounded text-emerald">rejected</code>, or <code className="text-xs bg-champagne px-1 py-0.5 rounded text-emerald">hired</code>) through your dashboard.
            </p>
          </div>
        </Card>

        {/* Recruiter Terms & Acceptable Use */}
        <Card className="p-6 sm:p-8 bg-cream border-border shadow-emerald-sm space-y-4">
          <div className="flex items-center gap-2 text-emerald">
            <ShieldCheck className="w-5 h-5 text-gold" />
            <h2 className="font-display text-xl font-bold text-emerald-dark">
              4. Recruiter Conduct &amp; Acceptable Job Postings
            </h2>
          </div>
          <div className="space-y-3 text-sm text-body/80 leading-relaxed">
            <p>
              Recruiters and employers represent that they have legal authority to hire on behalf of their
              stated organization. To ensure candidate protection, recruiters strictly agree to:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>No Fake or Misleading Postings:</strong> Post only genuine, existing job opportunities
                with accurate job descriptions, work mode designations (remote, hybrid, onsite), and truthful
                salary parameters when displayed.
              </li>
              <li>
                <strong>No Discrimination:</strong> Adhere to all applicable equal employment opportunity laws.
                Postings must not discriminate based on race, religion, gender, disability, age, or any legally
                protected status.
              </li>
              <li>
                <strong>No Candidate Scraping:</strong> Access applicant records solely to evaluate candidates
                for the specific listing they applied to. Mass downloading, scraping, or harvesting candidate
                resumes for external databases or unsolicited commercial spam is strictly prohibited.
              </li>
              <li>
                <strong>No Application Fees:</strong> Never solicit application fees, training charges, or
                security deposits from candidates as a condition for interviewing or applying.
              </li>
            </ul>
          </div>
        </Card>

        {/* Suspension & Termination */}
        <Card className="p-6 sm:p-8 bg-cream border-border shadow-emerald-sm space-y-4">
          <div className="flex items-center gap-2 text-error">
            <Ban className="w-5 h-5" />
            <h2 className="font-display text-xl font-bold text-emerald-dark">
              5. Prohibited Conduct &amp; Account Suspension
            </h2>
          </div>
          <div className="space-y-3 text-sm text-body/80 leading-relaxed">
            <p>
              We reserve the right to immediately suspend, restrict, or permanently terminate any account
              found violating these Terms, engaging in fraudulent behavior, impersonating organizations or
              candidates, or attempting to bypass security boundaries, rate limits, or access controls.
            </p>
            <p>
              Suspended users lose access to application management, profile editing, and posting capabilities.
            </p>
          </div>
        </Card>

        {/* Disclaimer */}
        <Card className="p-6 sm:p-8 bg-cream border-border shadow-emerald-sm space-y-4">
          <div className="flex items-center gap-2 text-gold">
            <AlertCircle className="w-5 h-5" />
            <h2 className="font-display text-xl font-bold text-emerald-dark">
              6. No Employment Guarantee Disclaimer
            </h2>
          </div>
          <div className="space-y-3 text-sm text-body/80 leading-relaxed">
            <p>
              Career OS is a technology platform facilitating communication and application workflows between
              candidates and employers.
            </p>
            <p className="font-semibold text-emerald-dark">
              Career OS does not guarantee interviews, job placements, employment offers, or candidate
              suitability. Hiring decisions, background verification, contract negotiations, and employment
              terms rest exclusively between the hiring organization and the candidate.
            </p>
          </div>
        </Card>

        {/* Account Rights & Export */}
        <Card className="p-6 sm:p-8 bg-cream border-border shadow-emerald-sm space-y-4">
          <div className="flex items-center gap-2 text-emerald">
            <FileText className="w-5 h-5 text-gold" />
            <h2 className="font-display text-xl font-bold text-emerald-dark">
              7. User Control: Data Export &amp; Account Deletion
            </h2>
          </div>
          <p className="text-sm text-body/80 leading-relaxed">
            You maintain full sovereignty over your data. At any time via your{" "}
            <Link href={ROUTES.ACCOUNT} className="text-emerald font-semibold underline hover:text-gold transition-colors">
              Account Settings
            </Link>
            , you can:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-sm text-body/80">
            <li>
              <strong>Export Your Data:</strong> Download a comprehensive JSON archive of all your Career OS
              records, including profile information, uploaded resume references, and application logs.
            </li>
            <li>
              <strong>Permanent Deletion:</strong> Permanently delete your account. This action immediately
              purges your login credentials, profile data, resume files, and associated records.
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
};

