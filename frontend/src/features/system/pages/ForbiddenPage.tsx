"use client";

import React from "react";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { ROUTES } from "../../../constants/routes";

export const ForbiddenPage: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-lg mx-auto">
      <div className="w-16 h-16 rounded-full bg-error-bg border border-error-border flex items-center justify-center text-error mb-4 shadow-emerald-sm">
        <ShieldAlert className="w-8 h-8" />
      </div>
      <h1 className="font-fraunces text-4xl sm:text-5xl font-bold text-emerald-dark mb-2">
        Access Denied
      </h1>
      <p className="text-sm text-muted mb-8 leading-relaxed">
        You do not have permission to view or manage this section. Please return to your authorized dashboard or browse public job listings.
      </p>
      <Link href={ROUTES.HOME}>
        <Button variant="primary">Return Home</Button>
      </Link>
    </div>
  );
};

