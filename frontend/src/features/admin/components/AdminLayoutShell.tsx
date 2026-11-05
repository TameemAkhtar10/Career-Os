"use client";

import React from "react";
import { AdminGuard } from "./AdminGuard";
import { AdminNavbar } from "./AdminNavbar";

interface AdminLayoutShellProps {
  children: React.ReactNode;
}

export const AdminLayoutShell: React.FC<AdminLayoutShellProps> = ({ children }) => {
  return (
    <AdminGuard>
      <div className="min-h-screen bg-champagne/40">
        <AdminNavbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </div>
    </AdminGuard>
  );
};

