"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Job } from "../../../types/job";
import { JobCard } from "../components/JobCard";
import { EmptyState } from "../../../components/feedback/EmptyState";
import { ErrorState } from "../../../components/feedback/ErrorState";
import { Button } from "../../../components/ui/Button";
import { ROUTES } from "../../../constants/routes";
import {
  Search,
  MapPin,
  ArrowRight,
  Sparkles,
  School,
  Building,
  Target,
  Rocket,
  ShieldCheck,
  CheckCircle,
} from "lucide-react";

export interface LandingPageProps {
  initialJobs: Job[];
  totalJobs: number;
  hasError?: boolean;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  initialJobs,
  totalJobs,
  hasError = false,
}) => {
  const router = useRouter();
  const [keyword, setKeyword] = useState("");
  const [city, setCity] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (keyword.trim()) params.set("q", keyword.trim());
    if (city.trim()) params.set("city", city.trim());
    router.push(`${ROUTES.JOBS}?${params.toString()}`);
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* ── 1. Hero Section ─────────────────────────────────────────────── */}
      <section className="relative pt-16 pb-20 md:pt-24 md:pb-28 px-4 sm:px-6 lg:px-8 overflow-hidden bg-hero-glow">
        <div className="max-w-4xl mx-auto text-center relative z-10">
         

          {/* Heading */}
          <h1 className="font-display text-4xl sm:text-6xl md:text-7xl font-bold tracking-[-0.01em] text-emerald-dark leading-[1.1] mb-6">
            Find Your First Job. <br />
            <span className="italic font-normal text-gold">Launch Your Career.</span>
          </h1>

          <p className="text-base sm:text-xl text-body/80 max-w-2xl mx-auto font-normal leading-relaxed mb-10">
            A verified platform connecting graduates with high-growth companies. Direct hiring, transparent salary insights, and structured applications.
          </p>

          {/* Hero Dual Search Bar */}
          <form
            onSubmit={handleSearch}
            className="bg-cream p-3 sm:p-4 rounded-card border border-border shadow-emerald-lg max-w-3xl mx-auto flex flex-col sm:flex-row items-stretch gap-3 text-left"
          >
            <div className="flex-1 flex items-center gap-3 px-3.5 py-2.5 bg-cream-input rounded-ui border border-border/60 focus-within:border-gold focus-within:ring-2 focus-within:ring-gold/20 transition-all">
              <Search className="w-5 h-5 text-emerald shrink-0" />
              <div className="w-full">
                <label className="block text-[10px] font-bold text-muted uppercase tracking-wider">
                  Role or Skill
                </label>
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="e.g. Software Engineer, React"
                  className="w-full bg-transparent border-none p-0 text-body text-sm font-medium placeholder:text-muted/60 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex-1 flex items-center gap-3 px-3.5 py-2.5 bg-cream-input rounded-ui border border-border/60 focus-within:border-gold focus-within:ring-2 focus-within:ring-gold/20 transition-all">
              <MapPin className="w-5 h-5 text-emerald shrink-0" />
              <div className="w-full">
                <label className="block text-[10px] font-bold text-muted uppercase tracking-wider">
                  Location
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Bengaluru, Remote, Delhi"
                  className="w-full bg-transparent border-none p-0 text-body text-sm font-medium placeholder:text-muted/60 focus:outline-none"
                />
              </div>
            </div>

            <Button type="submit" variant="primary" size="lg" className="sm:w-auto w-full gap-2">
              <span>Search</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>

          {/* Real API Metric Count */}
          <div className="mt-6 flex items-center justify-center gap-2 text-xs sm:text-sm text-muted">
            <span className="w-2 h-2 rounded-full bg-gold" />
            <span className="font-medium">
              Total open positions:{" "}
              <strong className="text-emerald-dark font-bold text-base tabular-nums">
                {totalJobs}
              </strong>
            </span>
          </div>
        </div>
      </section>

      {/* ── 2. Latest Fresher Jobs Strip ─────────────────────────────────── */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gold mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Curated Opportunities</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold text-emerald-dark">
              Latest Fresher Jobs
            </h2>
            <p className="text-xs sm:text-sm text-muted mt-1">
              Positions requiring zero prior experience, verified directly from recruiters.
            </p>
          </div>

          <Link href="/jobs?fresher=true">
            <Button variant="outline" size="sm" className="gap-1.5">
              <span>View All Fresher Roles</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>

        {/* Content based on real API state */}
        {hasError ? (
          <ErrorState
            title="Unable to load fresher positions"
            message="We could not retrieve latest opportunities from the server right now."
          />
        ) : initialJobs.length === 0 ? (
          <EmptyState
            title="No fresher jobs found right now"
            description="Verified opportunities are updated regularly as recruiters publish new openings."
            actionLabel="Browse All Open Roles"
            onAction={() => router.push(ROUTES.JOBS)}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {initialJobs.map((job) => (
              <JobCard key={job._id} job={job} />
            ))}
          </div>
        )}
      </section>

      {/* ── 3. For Freshers & For Recruiters Cards ───────────────────────── */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          {/* Card: For Freshers */}
          <div className="bg-gradient-to-br from-emerald to-emerald-dark text-white rounded-card p-8 sm:p-10 flex flex-col justify-between shadow-emerald-lg border border-emerald-hover relative overflow-hidden">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold uppercase tracking-wider text-gold-light border border-white/10">
                <School className="w-3.5 h-3.5 text-gold-start" />
                <span>For Candidates</span>
              </div>
              <h3 className="font-display text-2xl sm:text-3xl font-semibold leading-tight">
                Step into Your Career with Zero Gatekeeping.
              </h3>
              <p className="text-champagne/80 text-sm leading-relaxed">
                Overcome the &quot;requires 3 years experience for an entry-level position&quot; hurdle. Apply to verified fresher openings and track every stage of your application.
              </p>
              <ul className="space-y-3 text-xs sm:text-sm text-champagne/90">
                <li className="flex items-center gap-2.5">
                  <CheckCircle className="w-4 h-4 text-gold shrink-0" />
                  <span>Roles verified for zero minimum years of experience</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle className="w-4 h-4 text-gold shrink-0" />
                  <span>Real-time status updates on all submitted applications</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle className="w-4 h-4 text-gold shrink-0" />
                  <span>Complete profile completeness tracking to strengthen candidacy</span>
                </li>
              </ul>
            </div>
            <div className="mt-8 pt-6 border-t border-white/10">
              <Link href={ROUTES.REGISTER}>
                <Button variant="secondary" size="md">
                  Create Candidate Profile
                </Button>
              </Link>
            </div>
          </div>

          {/* Card: For Recruiters */}
          <div className="bg-cream rounded-card p-8 sm:p-10 flex flex-col justify-between shadow-emerald-md border border-border">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald/10 text-xs font-semibold uppercase tracking-wider text-emerald-dark border border-emerald/20">
                <Building className="w-3.5 h-3.5 text-emerald" />
                <span>For Employers</span>
              </div>
              <h3 className="font-display text-2xl sm:text-3xl font-semibold text-emerald-dark leading-tight">
                Hire High-Caliber Young Talent Directly.
              </h3>
              <p className="text-body/80 text-sm leading-relaxed">
                Connect with motivated candidates actively seeking entry-level positions. View candidate skill match scores calculated directly against your requirements.
              </p>
              <ul className="space-y-3 text-xs sm:text-sm text-body/90">
                <li className="flex items-center gap-2.5">
                  <CheckCircle className="w-4 h-4 text-emerald shrink-0" />
                  <span>Post full-time, internship, or contract requisitions</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle className="w-4 h-4 text-emerald shrink-0" />
                  <span>Automated skill-overlap match score ranking for applicants</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle className="w-4 h-4 text-emerald shrink-0" />
                  <span>Manage applicant workflow from shortlist to hire</span>
                </li>
              </ul>
            </div>
            <div className="mt-8 pt-6 border-t border-border/60">
              <Link href={ROUTES.REGISTER}>
                <Button variant="primary" size="md">
                  Start Hiring
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. 3-Step How It Works ───────────────────────────────────────── */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="text-center max-w-xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-gold">
            Structured Hiring
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-semibold text-emerald-dark mt-1">
            How Career OS Works
          </h2>
          <p className="text-sm text-muted mt-2">
            A three-step workflow designed for clarity and efficiency.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-cream p-7 rounded-card border border-border shadow-emerald-sm">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-gold-start to-gold text-white font-display font-bold lining-nums flex items-center justify-center mb-4 shadow-emerald-sm">
              1
            </div>
            <h3 className="font-display text-xl font-semibold text-emerald-dark mb-2">
              Complete Profile
            </h3>
            <p className="text-xs text-body/80 leading-relaxed">
              Add your education, skills, projects, and portfolio links. Our profile completeness indicator guides you to 100%.
            </p>
          </div>

          <div className="bg-cream p-7 rounded-card border border-border shadow-emerald-sm">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-gold-start to-gold text-white font-display font-bold lining-nums flex items-center justify-center mb-4 shadow-emerald-sm">
              2
            </div>
            <h3 className="font-display text-xl font-semibold text-emerald-dark mb-2">
              Discover Positions
            </h3>
            <p className="text-xs text-body/80 leading-relaxed">
              Filter openings by city, work mode, job type, skills, and fresher-friendly eligibility with clear CTC disclosures.
            </p>
          </div>

          <div className="bg-cream p-7 rounded-card border border-border shadow-emerald-sm">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-gold-start to-gold text-white font-display font-bold lining-nums flex items-center justify-center mb-4 shadow-emerald-sm">
              3
            </div>
            <h3 className="font-display text-xl font-semibold text-emerald-dark mb-2">
              Apply &amp; Track
            </h3>
            <p className="text-xs text-body/80 leading-relaxed">
              Submit your tailored cover note in one click. Receive timeline updates as recruiters review, shortlist, and decide.
            </p>
          </div>
        </div>
      </section>

      {/* ── 5. CTA Banner ────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 w-full">
        <div className="bg-gradient-to-br from-emerald to-emerald-dark rounded-[24px] p-8 sm:p-14 text-center text-white relative overflow-hidden shadow-emerald-float border border-emerald-hover">
          <div className="max-w-2xl mx-auto relative z-10 space-y-6">
            <h2 className="font-display text-3xl sm:text-5xl font-semibold leading-tight">
              Ready to take the next step?
            </h2>
            <p className="text-sm sm:text-base text-champagne/80 max-w-lg mx-auto">
              Create your account today as a candidate or recruiter and start navigating opportunities on Career OS.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link href={ROUTES.REGISTER} className="w-full sm:w-auto">
                <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                  Get Started Free
                </Button>
              </Link>
              <Link href={ROUTES.LOGIN} className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="w-full sm:w-auto text-white border-white/40 hover:bg-white/10">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

