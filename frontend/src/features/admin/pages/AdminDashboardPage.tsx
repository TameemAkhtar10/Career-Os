"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "../services/admin.api";
import { AdminStats } from "../../../types/admin";
import { Skeleton } from "../../../components/ui/Skeleton";
import { Card } from "../../../components/ui/Card";
import { Users, Briefcase, FileText, TrendingUp } from "lucide-react";

interface StatCardProps {
  label: string;
  value: number;
  color?: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, color = "text-emerald-ink" }) => (
  <div className="p-4 rounded-xl bg-champagne/30 border border-champagne-border flex flex-col gap-1">
    <span className="text-xs text-body-text/60 font-medium">{label}</span>
    <span className={`font-heading text-2xl font-bold ${color}`}>{value.toLocaleString()}</span>
  </div>
);

export const AdminDashboardPage: React.FC = () => {
  const { data: res, isLoading, error } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: () => adminApi.getStats(),
  });

  const stats = res?.data as AdminStats | undefined;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <p className="text-sm text-error-red">Failed to load dashboard stats. Please refresh.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-emerald-ink">
          Admin Dashboard
        </h1>
        <p className="text-sm text-body-text/70 mt-1">
          Platform overview and key metrics.
        </p>
      </div>

      {/* Users Stats */}
      <Card className="p-6 bg-cream border-champagne-border space-y-4">
        <div className="flex items-center gap-2 border-b border-champagne-border/60 pb-3">
          <Users className="w-5 h-5 text-gold-accent" />
          <h2 className="font-heading text-lg font-bold text-emerald-ink">Users</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <StatCard label="Total Users" value={stats.users.total} />
          <StatCard label="Candidates" value={stats.users.candidates} color="text-emerald-dark" />
          <StatCard label="Recruiters" value={stats.users.recruiters} color="text-gold-accent" />
          <StatCard label="Admins" value={stats.users.admins} color="text-body-text/80" />
          <div className="p-4 rounded-xl bg-emerald/10 border border-emerald/30 flex flex-col gap-2 col-span-2 sm:col-span-1">
            <span className="text-xs text-emerald-dark font-semibold flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> Signups (Last 7 Days)
            </span>
            {/* Simple SVG bar chart for signups */}
            <div className="flex items-end gap-1">
              <div
                className="bg-emerald rounded-sm w-6 transition-all"
                style={{
                  height: `${Math.max(8, Math.min(48, (stats.users.signupsLast7Days / Math.max(1, stats.users.total)) * 200))}px`,
                }}
              />
            </div>
            <span className="font-heading text-2xl font-bold text-emerald-dark">
              {stats.users.signupsLast7Days}
            </span>
          </div>
        </div>
      </Card>

      {/* Jobs Stats */}
      <Card className="p-6 bg-cream border-champagne-border space-y-4">
        <div className="flex items-center gap-2 border-b border-champagne-border/60 pb-3">
          <Briefcase className="w-5 h-5 text-gold-accent" />
          <h2 className="font-heading text-lg font-bold text-emerald-ink">Jobs</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Total Jobs" value={stats.jobs.total} />
          <StatCard label="Open" value={stats.jobs.open} color="text-emerald-dark" />
          <StatCard label="Closed" value={stats.jobs.closed} color="text-error-red" />
          <StatCard label="Draft" value={stats.jobs.draft} color="text-body-text/70" />
        </div>
      </Card>

      {/* Applications Stats */}
      <Card className="p-6 bg-cream border-champagne-border space-y-4">
        <div className="flex items-center gap-2 border-b border-champagne-border/60 pb-3">
          <FileText className="w-5 h-5 text-gold-accent" />
          <h2 className="font-heading text-lg font-bold text-emerald-ink">Applications</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard label="Total" value={stats.applications.total} />
          <StatCard label="Applied" value={stats.applications.applied} color="text-body-text/80" />
          <StatCard label="Shortlisted" value={stats.applications.shortlisted} color="text-gold-accent" />
          <StatCard label="Hired" value={stats.applications.hired} color="text-emerald-dark" />
          <StatCard label="Rejected" value={stats.applications.rejected} color="text-error-red" />
          <StatCard label="Withdrawn" value={stats.applications.withdrawn} color="text-body-text/60" />
        </div>
      </Card>
    </div>
  );
};

