"use client";

import React from "react";
import Link from "next/link";
import { Clock, LogIn } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { Logo } from "../../../components/layout/Logo";
import { ROUTES } from "../../../constants/routes";

export const SessionExpiredPage: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-lg mx-auto space-y-6">
      <div className="mb-2">
        <Logo />
      </div>

      <div className="w-16 h-16 rounded-full bg-champagne border border-border flex items-center justify-center text-gold mx-auto shadow-emerald-sm">
        <Clock className="w-8 h-8" />
      </div>

      <div className="space-y-2">
        <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-emerald-dark">
          Session Expired
        </h1>
        <p className="text-sm text-muted leading-relaxed">
          Your authentication session has expired due to inactivity or token rotation. Please sign in again to access your account securely.
        </p>
      </div>

      <div className="pt-2">
        <Link href={ROUTES.LOGIN}>
          <Button variant="primary" size="md" className="gap-2">
            <LogIn className="w-4 h-4" />
            Sign In Again
          </Button>
        </Link>
      </div>
    </div>
  );
};

