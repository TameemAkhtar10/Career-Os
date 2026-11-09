import React from "react";
import Link from "next/link";
import { Card } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { ROUTES } from "../../../constants/routes";
import { Briefcase, Shield, Sparkles, UserCheck, Target, ArrowRight } from "lucide-react";

export const AboutPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-champagne/40 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Hero Section */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-badge bg-champagne border border-border text-emerald text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-gold" />
            <span>Built for Modern Hiring</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-emerald-dark tracking-tight leading-[1.15]">
            The Operating System for Careers &amp; Recruitment
          </h1>
          <p className="text-sm sm:text-base text-body/80 leading-relaxed">
            Career OS is built to eliminate noise, spam, and opaque applicant tracking systems.
            We provide a transparent, skill-aligned bridge connecting motivated candidates directly
            with verified hiring teams.
          </p>
        </div>

        {/* Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 bg-cream border-border shadow-emerald-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-champagne border border-border flex items-center justify-center text-emerald">
              <UserCheck className="w-5 h-5 text-gold" />
            </div>
            <h3 className="font-display text-lg font-bold text-emerald-dark">
              Fresher-Centric Design
            </h3>
            <p className="text-xs text-body/75 leading-relaxed">
              Early-career candidates often face unreasonable experience barriers. We spotlight
              zero-to-one entry roles, project achievements, and raw skill proficiencies rather than
              arbitrary resume gatekeeping.
            </p>
          </Card>

          <Card className="p-6 bg-cream border-border shadow-emerald-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-champagne border border-border flex items-center justify-center text-emerald">
              <Shield className="w-5 h-5 text-gold" />
            </div>
            <h3 className="font-display text-lg font-bold text-emerald-dark">
              Privacy by Architecture
            </h3>
            <p className="text-xs text-body/75 leading-relaxed">
              We never sell candidate data or expose resumes in open, scrapeable databases. Only the
              recruiter whose job you specifically applied to can view your resume and direct contact
              details.
            </p>
          </Card>

          <Card className="p-6 bg-cream border-border shadow-emerald-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-champagne border border-border flex items-center justify-center text-emerald">
              <Target className="w-5 h-5 text-gold" />
            </div>
            <h3 className="font-display text-lg font-bold text-emerald-dark">
              Honest Communication
            </h3>
            <p className="text-xs text-body/75 leading-relaxed">
              Clear application statuses (<code className="text-[11px] bg-champagne px-1 py-0.5 rounded text-emerald">applied</code>, <code className="text-[11px] bg-champagne px-1 py-0.5 rounded text-emerald">shortlisted</code>, <code className="text-[11px] bg-champagne px-1 py-0.5 rounded text-emerald">rejected</code>, <code className="text-[11px] bg-champagne px-1 py-0.5 rounded text-emerald">hired</code>) with real-time email updates keep both candidates and recruiters aligned at every stage.
            </p>
          </Card>
        </div>

        {/* How It Works Section */}
        <Card className="p-6 sm:p-8 bg-cream border-border shadow-emerald-sm space-y-6">
          <div className="space-y-1">
            <h2 className="font-display text-2xl font-bold text-emerald-dark">
              How Career OS Operates
            </h2>
            <p className="text-xs sm:text-sm text-muted">
              A clean, focused workflow designed around mutual respect and transparency.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div className="p-5 rounded-xl bg-champagne/20 border border-border space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald text-white text-xs font-bold flex items-center justify-center">
                  1
                </span>
                <h3 className="font-semibold text-emerald-dark text-sm">For Candidates</h3>
              </div>
              <ul className="space-y-2 text-xs text-body/80 leading-relaxed">
                <li>• Verify your email with an instant 5-minute security code (OTP).</li>
                <li>• Build your structured profile (skills, projects, education) and upload your PDF resume.</li>
                <li>• Browse verified roles with clear work modes and salary visibility.</li>
                <li>• Submit applications in one click and track review status live.</li>
                <li>• Opt in or out of daily job match digests with one click.</li>
              </ul>
            </div>

            <div className="p-5 rounded-xl bg-champagne/20 border border-border space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-gold text-white text-xs font-bold flex items-center justify-center">
                  2
                </span>
                <h3 className="font-semibold text-emerald-dark text-sm">For Recruiters</h3>
              </div>
              <ul className="space-y-2 text-xs text-body/80 leading-relaxed">
                <li>• Register your hiring organization and post openings in minutes.</li>
                <li>• Specify exact skills, work location, and fresher-friendly flags.</li>
                <li>• Review incoming candidates with automated skill-match rankings.</li>
                <li>• Update application statuses and notify candidates automatically.</li>
                <li>• Automatic deadline enforcement closes expired listings smoothly.</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* CTA Card */}
        <div className="text-center p-8 sm:p-10 rounded-card bg-gradient-to-br from-emerald to-emerald-dark text-white space-y-4 shadow-emerald-md">
          <h2 className="font-display text-2xl sm:text-3xl font-bold">
            Ready to find your next opportunity?
          </h2>
          <p className="text-sm text-white/80 max-w-lg mx-auto leading-relaxed">
            Join candidates and hiring managers using Career OS for clean, straightforward recruitment.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link href={ROUTES.JOBS}>
              <Button variant="secondary" size="md" className="gap-2">
                <Briefcase className="w-4 h-4" />
                Browse Open Jobs
              </Button>
            </Link>
            <Link href={ROUTES.REGISTER}>
              <Button variant="gold" size="md" className="gap-2">
                <span>Create an Account</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

