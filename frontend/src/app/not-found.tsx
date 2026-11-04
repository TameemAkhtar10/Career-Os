import React from "react";
import Link from "next/link";
import { Button } from "../components/ui/Button";
import { ROUTES } from "../constants/routes";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-lg mx-auto">
      <div className="w-16 h-16 rounded-full bg-champagne border border-border flex items-center justify-center text-gold mb-4 shadow-emerald-sm">
        <Compass className="w-8 h-8" />
      </div>
      <h1 className="font-fraunces text-7xl sm:text-8xl font-black text-emerald-dark tracking-tight">
        404
      </h1>
      <h2 className="font-fraunces text-2xl font-bold text-body mt-2 mb-3">
        Page Not Found
      </h2>
      <p className="text-sm text-muted mb-8 leading-relaxed">
        The link you followed may be broken or the page may have been removed. Let&apos;s get you back to discovering jobs.
      </p>
      <div className="flex items-center gap-3">
        <Link href={ROUTES.HOME}>
          <Button variant="primary">Return Home</Button>
        </Link>
        <Link href={ROUTES.JOBS}>
          <Button variant="secondary">Browse Jobs</Button>
        </Link>
      </div>
    </div>
  );
}

