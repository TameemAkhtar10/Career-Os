"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../../../providers/AuthProvider";
import { ROUTES } from "../../../constants/routes";
import { LayoutDashboard, Users, Briefcase, ScrollText, Clock, Settings, LogOut } from "lucide-react";

const NAV_ITEMS = [
  { href: ROUTES.ADMIN.ROOT, label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: ROUTES.ADMIN.USERS, label: "Users", icon: Users, exact: false },
  { href: ROUTES.ADMIN.JOBS, label: "Jobs", icon: Briefcase, exact: false },
  { href: ROUTES.ADMIN.SCHEDULED_JOBS, label: "Scheduled Jobs", icon: Clock, exact: false },
  { href: ROUTES.ADMIN.AUDIT_LOGS, label: "Audit Log", icon: ScrollText, exact: false },
  { href: ROUTES.ACCOUNT, label: "Account", icon: Settings, exact: false },
];

export const AdminNavbar: React.FC = () => {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const isActive = (href: string, exact: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <nav className="sticky top-0 z-40 w-full bg-emerald-ink border-b border-emerald-dark/40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <span className="font-display font-bold tracking-[-0.01em] text-white text-lg mr-4">
            Career OS <span className="font-sans text-gold-accent text-xs font-semibold uppercase tracking-widest">Admin</span>
          </span>
          <div className="hidden sm:flex items-center gap-1">
            {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
              const active = isActive(href, exact);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    active
                      ? "bg-white/10 text-white font-semibold"
                      : "text-white/70 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-white/60 hidden sm:block">{user?.name}</span>
          <button
            onClick={() => logout()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      <div className="sm:hidden px-4 pb-2 flex items-center gap-1 overflow-x-auto">
        {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
          const active = isActive(href, exact);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                active
                  ? "bg-white/10 text-white"
                  : "text-white/60 hover:text-white"
              }`}
            >
              <Icon className="w-3 h-3" />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

