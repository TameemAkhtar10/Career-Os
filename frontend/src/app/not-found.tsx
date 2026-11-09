import React from "react";
import Link from "next/link";
import { Button } from "../components/ui/Button";
import { Logo } from "../components/layout/Logo";
import { ROUTES } from "../constants/routes";
import { Search, Home, Briefcase } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-xl mx-auto space-y-6">
      {/* Brand Logo */}
      <div className="mb-2">
        <Logo />
      </div>

      <div className="space-y-2">
        <span className="font-display text-7xl sm:text-8xl font-bold lining-nums text-emerald-dark tracking-tight leading-none block">
          404
        </span>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-body">
          Page Not Found
        </h1>
        <p className="text-sm text-muted max-w-md mx-auto leading-relaxed">
          The page you requested may have been moved, renamed, or is temporarily unavailable. Let&apos;s get you back on track.
        </p>
      </div>

      {/* Search box routing to /jobs?q= */}
      <form
        action={ROUTES.JOBS}
        method="GET"
        className="w-full max-w-md flex items-center gap-2 p-1.5 rounded-ui bg-cream border border-border shadow-emerald-sm focus-within:ring-2 focus-within:ring-gold focus-within:border-transparent transition-all"
      >
        <div className="pl-3 text-muted">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          name="q"
          placeholder="Search jobs by title, skill, or role..."
          className="flex-1 text-xs sm:text-sm bg-transparent border-none text-body placeholder:text-muted focus:outline-none px-2 py-1.5"
          aria-label="Search jobs"
        />
        <Button type="submit" variant="primary" size="sm" className="shrink-0 text-xs">
          Search
        </Button>
      </form>

      {/* Action Navigation */}
      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <Link href={ROUTES.HOME}>
          <Button variant="primary" size="md" className="gap-2">
            <Home className="w-4 h-4" />
            Go Home
          </Button>
        </Link>
        <Link href={ROUTES.JOBS}>
          <Button variant="secondary" size="md" className="gap-2">
            <Briefcase className="w-4 h-4" />
            Browse Jobs
          </Button>
        </Link>
      </div>
    </div>
  );
}
