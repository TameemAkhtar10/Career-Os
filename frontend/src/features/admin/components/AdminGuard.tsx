"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../providers/AuthProvider";
import { BrandLoader } from "../../../components/feedback/BrandLoader";

interface AdminGuardProps {
  children: React.ReactNode;
}

export const AdminGuard: React.FC<AdminGuardProps> = ({ children }) => {
  const { user, isAuthenticated, isInitialized } = useAuth();
  const router = useRouter();

  if (!isInitialized) {
    return <BrandLoader message="Verifying access..." />;
  }

  if (!isAuthenticated || !user) {
    if (typeof window !== "undefined") {
      router.replace("/login?next=/admin");
    }
    return <BrandLoader message="Redirecting to login..." />;
  }

  if (user.role !== "admin") {
    return (
      <div className="min-h-screen bg-champagne/40 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-4">
          <div className="text-6xl">🚫</div>
          <h1 className="font-heading text-2xl font-bold text-emerald-ink">Access Forbidden</h1>
          <p className="text-sm text-body-text/70">
            You do not have permission to access the admin panel.
          </p>
          <button
            onClick={() => router.push("/")}
            className="inline-flex items-center px-4 py-2 rounded-xl bg-emerald text-white text-sm font-semibold hover:brightness-105 transition-all"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

