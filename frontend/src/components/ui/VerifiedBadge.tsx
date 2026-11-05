"use client";

import React from "react";
import { ShieldCheck } from "lucide-react";

interface VerifiedBadgeProps {
  className?: string;
}

export const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({ className = "" }) => {
  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald/10 border border-emerald/30 text-[11px] font-semibold text-emerald-dark shrink-0 ${className}`}
    >
      <ShieldCheck className="w-3 h-3" />
      Verified
    </span>
  );
};

