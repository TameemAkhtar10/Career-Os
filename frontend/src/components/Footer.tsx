"use client";

import React from "react";
import Link from "next/link";
import { Logo } from "./layout/Logo";
import { ROUTES } from "../constants/routes";

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-border bg-cream/70 text-body py-12 px-4 sm:px-6 lg:px-8 mt-auto">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="md:col-span-2 space-y-4">
          <Logo />
          <p className="text-xs text-muted max-w-sm leading-relaxed">
            The platform designed for candidates and recruiters. Discover verified opportunities, apply seamlessly, and track recruitment progress in real time.
          </p>
          <p className="text-[11px] text-muted/80">
            © {new Date().getFullYear()} Career OS. All rights reserved.
          </p>
        </div>

        <div>
          <h4 className="font-fraunces font-bold text-emerald-dark text-sm mb-3">
            For Candidates
          </h4>
          <ul className="space-y-2 text-xs text-muted">
            <li>
              <Link href={ROUTES.JOBS} className="hover:text-emerald-dark transition-colors">
                Browse Jobs
              </Link>
            </li>
            <li>
              <Link href="/jobs?fresher=true" className="hover:text-emerald-dark transition-colors">
                Fresher Friendly Roles
              </Link>
            </li>
            <li>
              <Link href={ROUTES.CANDIDATE.APPLICATIONS} className="hover:text-emerald-dark transition-colors">
                Application Status
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-fraunces font-bold text-emerald-dark text-sm mb-3">
            For Recruiters
          </h4>
          <ul className="space-y-2 text-xs text-muted">
            <li>
              <Link href={ROUTES.RECRUITER.DASHBOARD} className="hover:text-emerald-dark transition-colors">
                Recruiter Dashboard
              </Link>
            </li>
            <li>
              <Link href={ROUTES.RECRUITER.NEW_JOB} className="hover:text-emerald-dark transition-colors">
                Post an Opening
              </Link>
            </li>
            <li>
              <Link href={ROUTES.RECRUITER.COMPANY} className="hover:text-emerald-dark transition-colors">
                Company Profile
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
};

