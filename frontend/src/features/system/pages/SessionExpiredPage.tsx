"use client";

import React from "react";
import Link from "next/link";
import { Clock, LogIn } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { ROUTES } from "../../../constants/routes";

export const SessionExpiredPage: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-lg mx-auto">
      <div className="w-16 h-16 rounded-full bg-champagne border border-border flex items-center justify-center text-gold mb-4 shadow-emerald-sm">
        <Clock className="w-8 h-8" />
      </div>
      <h1 className="font-fraunces text-4xl sm:text-5xl font-bold text-emerald-dark mb-2">
        Session Expired
      </h1>
      <p className="text-sm text-muted mb-8 leading-relaxed">
        Your authentication session has expired due to inactivity or token rotation. Please sign in again to access your account securely.
      </p>
      <Link href={ROUTES.LOGIN}>
        <Button variant="primary" className="gap-2">
          <LogIn className="w-4 h-4" />
          Sign In Again
        </Button>
      </Link>
    </div>
  );
};

