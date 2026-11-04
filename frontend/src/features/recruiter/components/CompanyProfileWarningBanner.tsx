"use client";

import React from "react";
import Link from "next/link";
import { useProfileMe } from "../../profile/hooks/useProfile";
import { RecruiterProfile } from "../../../types/profile";
import { AlertCircle, ArrowRight } from "lucide-react";

export const CompanyProfileWarningBanner: React.FC = () => {
  const { data: profileMe, isLoading } = useProfileMe();
  const profile = profileMe as RecruiterProfile | null;

  if (isLoading) return null;

  const hasCompanyProfile = Boolean(profile && profile.companyName?.trim());

  if (hasCompanyProfile) return null;

  return (
    <div className="bg-gradient-to-r from-gold-light via-champagne to-gold-light border-b border-gold-accent/40 px-4 py-3 text-body-text shadow-sm">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm">
        <div className="flex items-center gap-2 text-emerald-ink font-medium">
          <AlertCircle className="w-4 h-4 text-gold-accent shrink-0" />
          <span>
            <strong>Company profile required:</strong> You must complete your company details before you can post jobs.
          </span>
        </div>
        <Link
          href="/recruiter/company"
          className="inline-flex items-center gap-1 font-semibold text-emerald-ink underline hover:text-emerald-hover transition-colors shrink-0"
        >
          Complete Company Profile
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};

