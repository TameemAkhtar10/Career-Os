"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../providers/AuthProvider";
import { useProfileMe } from "../features/profile/hooks/useProfile";
import { RecruiterProfile } from "../types/profile";
import { Logo } from "./layout/Logo";
import { ROUTES } from "../constants/routes";
import { Button } from "./ui/Button";
import { Menu, X, LogOut, User as UserIcon, Briefcase, PlusCircle, Building, Settings } from "lucide-react";

/** Inner component so the hook only runs when authenticated */
const RecruiterAvatar: React.FC<{ initial: string }> = ({ initial }) => {
  const { data: profileMe } = useProfileMe();
  const profile = profileMe as RecruiterProfile | null;
  const logoUrl = profile?.companyLogoUrl;

  if (logoUrl) {
    return (
      <div className="w-8 h-8 rounded-full border border-champagne-border overflow-hidden bg-champagne/30 flex items-center justify-center">
        <img src={logoUrl} alt="Company logo" className="w-full h-full object-contain" />
      </div>
    );
  }
  return (
    <div className="w-8 h-8 rounded-full bg-emerald text-white flex items-center justify-center text-xs font-semibold">
      {initial}
    </div>
  );
};

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === "/" && pathname !== "/") return false;
    return pathname.startsWith(path);
  };

  const navLinkClass = (active: boolean) =>
    `text-sm font-medium transition-colors px-3 py-1.5 rounded-ui ${
      active
        ? "text-emerald-dark font-semibold bg-champagne/60"
        : "text-body/80 hover:text-emerald-dark hover:bg-cream/80"
    }`;

  return (
    <header className="sticky top-0 z-40 w-full bg-cream/82 backdrop-blur-md border-b border-border/60 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Logo />

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          {!isAuthenticated && (
            <>
              <Link href={ROUTES.JOBS} className={navLinkClass(isActive(ROUTES.JOBS))}>
                Jobs
              </Link>
              <Link href="/jobs?fresher=true" className={navLinkClass(false)}>
                For freshers
              </Link>
              <Link href={ROUTES.LOGIN} className={navLinkClass(false)}>
                For recruiters
              </Link>
            </>
          )}

          {isAuthenticated && user?.role === "candidate" && (
            <>
              <Link href={ROUTES.JOBS} className={navLinkClass(isActive(ROUTES.JOBS))}>
                Jobs
              </Link>
              <Link
                href={ROUTES.CANDIDATE.APPLICATIONS}
                className={navLinkClass(isActive(ROUTES.CANDIDATE.APPLICATIONS))}
              >
                My applications
              </Link>
              <Link
                href={ROUTES.CANDIDATE.PROFILE}
                className={navLinkClass(isActive(ROUTES.CANDIDATE.PROFILE))}
              >
                Profile
              </Link>
            </>
          )}

          {isAuthenticated && user?.role === "recruiter" && (
            <>
              <Link
                href={ROUTES.RECRUITER.DASHBOARD}
                className={navLinkClass(isActive(ROUTES.RECRUITER.DASHBOARD))}
              >
                Dashboard
              </Link>
              <Link
                href={ROUTES.RECRUITER.NEW_JOB}
                className={navLinkClass(isActive(ROUTES.RECRUITER.NEW_JOB))}
              >
                Post a job
              </Link>
              <Link
                href={ROUTES.RECRUITER.COMPANY}
                className={navLinkClass(isActive(ROUTES.RECRUITER.COMPANY))}
              >
                Company profile
              </Link>
            </>
          )}

          {isAuthenticated && user?.role === "admin" && (
            <>
              <Link href="/admin" className={navLinkClass(isActive("/admin"))}>
                Admin Dashboard
              </Link>
            </>
          )}
        </nav>

        {/* Right CTA / User Menu */}
        <div className="hidden md:flex items-center gap-3">
          {!isAuthenticated ? (
            <>
              <Link href={ROUTES.LOGIN}>
                <Button variant="ghost" size="sm">
                  Sign in
                </Button>
              </Link>
              <Link href={ROUTES.REGISTER}>
                <Button variant="primary" size="sm">
                  Get started
                </Button>
              </Link>
            </>
          ) : (
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 p-1.5 rounded-ui bg-champagne/60 border border-border hover:bg-champagne transition-colors focus:outline-none focus:ring-2 focus:ring-gold"
              >
                {user?.role === "recruiter" ? (
                  <RecruiterAvatar initial={user?.name?.charAt(0).toUpperCase() || "U"} />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-emerald text-white flex items-center justify-center text-xs font-semibold">
                    {user?.name?.charAt(0).toUpperCase() || "U"}
                  </div>
                )}
                <div className="text-left text-xs pr-1">
                  <p className="font-semibold text-emerald-dark leading-tight">{user?.name}</p>
                  <p className="text-[10px] text-muted capitalize leading-tight">{user?.role}</p>
                </div>
              </button>

              {userDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-52 bg-cream border border-border rounded-card shadow-emerald-lg py-2 z-50 animate-fadeIn"
                  onClick={() => setUserDropdownOpen(false)}
                >
                  <div className="px-4 py-2 border-b border-border/60">
                    <p className="text-xs font-semibold text-emerald-dark truncate">{user?.name}</p>
                    <p className="text-[11px] text-muted truncate">{user?.email}</p>
                  </div>
                  {user?.role === "candidate" && (
                    <>
                      <Link
                        href={ROUTES.CANDIDATE.PROFILE}
                        className="flex items-center gap-2 px-4 py-2 text-xs text-body hover:bg-champagne/60 transition-colors"
                      >
                        <UserIcon className="w-3.5 h-3.5" />
                        My Profile
                      </Link>
                      <Link
                        href={ROUTES.CANDIDATE.APPLICATIONS}
                        className="flex items-center gap-2 px-4 py-2 text-xs text-body hover:bg-champagne/60 transition-colors"
                      >
                        <Briefcase className="w-3.5 h-3.5" />
                        Applications
                      </Link>
                    </>
                  )}
                  {user?.role === "recruiter" && (
                    <>
                      <Link
                        href={ROUTES.RECRUITER.DASHBOARD}
                        className="flex items-center gap-2 px-4 py-2 text-xs text-body hover:bg-champagne/60 transition-colors"
                      >
                        <Briefcase className="w-3.5 h-3.5" />
                        Dashboard
                      </Link>
                      <Link
                        href={ROUTES.RECRUITER.NEW_JOB}
                        className="flex items-center gap-2 px-4 py-2 text-xs text-body hover:bg-champagne/60 transition-colors"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        Post a Job
                      </Link>
                      <Link
                        href={ROUTES.RECRUITER.COMPANY}
                        className="flex items-center gap-2 px-4 py-2 text-xs text-body hover:bg-champagne/60 transition-colors"
                      >
                        <Building className="w-3.5 h-3.5" />
                        Company Profile
                      </Link>
                    </>
                  )}
                  {/* Account link for all roles */}
                  <Link
                    href={ROUTES.ACCOUNT}
                    className="flex items-center gap-2 px-4 py-2 text-xs text-body hover:bg-champagne/60 transition-colors"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    Account
                  </Link>
                  <div className="border-t border-border/60 mt-1 pt-1">
                    <button
                      onClick={() => logout()}
                      className="w-full flex items-center gap-2 px-4 py-2 text-xs text-error hover:bg-error-bg/60 transition-colors text-left"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="flex md:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-ui text-body hover:text-emerald-dark hover:bg-cream focus:outline-none focus:ring-2 focus:ring-gold"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border/60 bg-cream p-4 space-y-3 animate-slideUp">
          <div className="flex flex-col space-y-2">
            {!isAuthenticated ? (
              <>
                <Link
                  href={ROUTES.JOBS}
                  onClick={() => setMobileMenuOpen(false)}
                  className={navLinkClass(isActive(ROUTES.JOBS))}
                >
                  Jobs
                </Link>
                <Link
                  href="/jobs?fresher=true"
                  onClick={() => setMobileMenuOpen(false)}
                  className={navLinkClass(false)}
                >
                  For freshers
                </Link>
                <Link
                  href={ROUTES.LOGIN}
                  onClick={() => setMobileMenuOpen(false)}
                  className={navLinkClass(false)}
                >
                  For recruiters
                </Link>
                <div className="pt-2 flex flex-col gap-2">
                  <Link href={ROUTES.LOGIN} onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" size="sm" className="w-full">
                      Sign in
                    </Button>
                  </Link>
                  <Link href={ROUTES.REGISTER} onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="primary" size="sm" className="w-full">
                      Get started
                    </Button>
                  </Link>
                </div>
              </>
            ) : (
              <>
                {user?.role === "candidate" && (
                  <>
                    <Link
                      href={ROUTES.JOBS}
                      onClick={() => setMobileMenuOpen(false)}
                      className={navLinkClass(isActive(ROUTES.JOBS))}
                    >
                      Jobs
                    </Link>
                    <Link
                      href={ROUTES.CANDIDATE.APPLICATIONS}
                      onClick={() => setMobileMenuOpen(false)}
                      className={navLinkClass(isActive(ROUTES.CANDIDATE.APPLICATIONS))}
                    >
                      My applications
                    </Link>
                    <Link
                      href={ROUTES.CANDIDATE.PROFILE}
                      onClick={() => setMobileMenuOpen(false)}
                      className={navLinkClass(isActive(ROUTES.CANDIDATE.PROFILE))}
                    >
                      Profile
                    </Link>
                  </>
                )}
                {user?.role === "recruiter" && (
                  <>
                    <Link
                      href={ROUTES.RECRUITER.DASHBOARD}
                      onClick={() => setMobileMenuOpen(false)}
                      className={navLinkClass(isActive(ROUTES.RECRUITER.DASHBOARD))}
                    >
                      Dashboard
                    </Link>
                    <Link
                      href={ROUTES.RECRUITER.NEW_JOB}
                      onClick={() => setMobileMenuOpen(false)}
                      className={navLinkClass(isActive(ROUTES.RECRUITER.NEW_JOB))}
                    >
                      Post a job
                    </Link>
                    <Link
                      href={ROUTES.RECRUITER.COMPANY}
                      onClick={() => setMobileMenuOpen(false)}
                      className={navLinkClass(isActive(ROUTES.RECRUITER.COMPANY))}
                    >
                      Company profile
                    </Link>
                  </>
                )}
                {/* Account link for mobile */}
                <Link
                  href={ROUTES.ACCOUNT}
                  onClick={() => setMobileMenuOpen(false)}
                  className={navLinkClass(isActive(ROUTES.ACCOUNT))}
                >
                  Account
                </Link>
                <div className="pt-3 border-t border-border/60">
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center justify-center gap-2 p-2 rounded-ui bg-error-bg text-error text-xs font-semibold"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};






