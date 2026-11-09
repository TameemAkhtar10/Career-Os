"use client";

import React from "react";
import Link from "next/link";
import { Logo } from "./layout/Logo";
import { ROUTES } from "../constants/routes";

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-border bg-cream/80 text-body py-12 px-4 sm:px-6 lg:px-8 mt-auto">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-5 gap-8">
        {/* Brand column */}
        <div className="md:col-span-2 space-y-4">
          <Logo />
          <p className="text-xs text-muted max-w-sm leading-relaxed">
            The dedicated platform for verified candidates and modern recruiters. Discover genuine
            opportunities, apply with confidence, and manage recruitment lifecycles with complete transparency.
          </p>
          <p className="text-xs text-muted">
            &copy; {new Date().getFullYear()} Career OS
          </p>
        </div>

        {/* Platform links */}
        <div>
          <h4 className="font-semibold text-emerald-dark text-sm mb-3">Platform</h4>
          <ul className="space-y-2 text-xs text-muted">
            <li>
              <Link href={ROUTES.JOBS} className="hover:text-emerald-dark transition-colors">
                Jobs
              </Link>
            </li>
            <li>
              <Link href="/jobs?fresher=true" className="hover:text-emerald-dark transition-colors">
                For freshers
              </Link>
            </li>
            <li>
              <Link href={ROUTES.LOGIN} className="hover:text-emerald-dark transition-colors">
                For recruiters
              </Link>
            </li>
          </ul>
        </div>

        {/* Company links */}
        <div>
          <h4 className="font-semibold text-emerald-dark text-sm mb-3">Company</h4>
          <ul className="space-y-2 text-xs text-muted">
            <li>
              <Link href={ROUTES.ABOUT} className="hover:text-emerald-dark transition-colors">
                About
              </Link>
            </li>
            <li>
              <Link href={ROUTES.FAQ} className="hover:text-emerald-dark transition-colors">
                FAQ
              </Link>
            </li>
            <li>
              <Link href={ROUTES.CONTACT} className="hover:text-emerald-dark transition-colors">
                Contact
              </Link>
            </li>
          </ul>
        </div>

        {/* Legal links */}
        <div>
          <h4 className="font-semibold text-emerald-dark text-sm mb-3">Legal</h4>
          <ul className="space-y-2 text-xs text-muted">
            <li>
              <Link href={ROUTES.TERMS} className="hover:text-emerald-dark transition-colors">
                Terms
              </Link>
            </li>
            <li>
              <Link href={ROUTES.PRIVACY} className="hover:text-emerald-dark transition-colors">
                Privacy
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
};
