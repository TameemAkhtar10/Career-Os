"use client";

import React from "react";
import Link from "next/link";
import { ShieldAlert, Home, Briefcase } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { Logo } from "../../../components/layout/Logo";
import { ROUTES } from "../../../constants/routes";

export const ForbiddenPage: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-lg mx-auto space-y-6">
      <div className="mb-2">
        <Logo />
      </div>

      <div className="w-16 h-16 rounded-full bg-error-bg border border-error-border flex items-center justify-center text-error mx-auto shadow-emerald-sm">
        <ShieldAlert className="w-8 h-8" />
      </div>

      <div className="space-y-2">
        <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-emerald-dark">
          403 — Access Denied
        </h1>
        <p className="text-sm text-muted leading-relaxed">
          You do not have permission to view or manage this section. Please return to your authorized dashboard or browse public job listings.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <Link href={ROUTES.HOME}>
          <Button variant="primary" size="md" className="gap-2">
            <Home className="w-4 h-4" />
            Return Home
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
};

