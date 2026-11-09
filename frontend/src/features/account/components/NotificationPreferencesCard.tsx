"use client";

import React from "react";
import { useAuth } from "../../../providers/AuthProvider";
import { Card } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { useNotificationPreferences } from "../hooks/useNotificationPreferences";
import { Bell, Briefcase, UserCheck, AlertCircle, RefreshCw } from "lucide-react";

interface ToggleSwitchProps {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ id, checked, onChange, disabled }) => {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 focus:ring-offset-cream disabled:opacity-50 disabled:cursor-not-allowed ${
        checked ? "bg-emerald" : "bg-muted/30"
      }`}
    >
      <span className="sr-only">Toggle notification preference</span>
      <span
        aria-hidden="true"
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
};

export const NotificationPreferencesCard: React.FC = () => {
  const { user } = useAuth();
  const { preferences, isLoading, isError, error, updatePreference, isUpdating } =
    useNotificationPreferences();

  const isCandidate = user?.role === "candidate";
  const isRecruiter = user?.role === "recruiter";
  const isAdmin = user?.role === "admin";

  if (isLoading) {
    return (
      <Card className="p-6 bg-cream border-border space-y-4">
        <div className="flex items-center gap-2 border-b border-border/60 pb-3">
          <Bell className="w-5 h-5 text-gold" />
          <h2 className="font-heading text-lg font-bold text-emerald">Email Notifications</h2>
        </div>
        <div className="space-y-4 animate-pulse">
          <div className="h-14 bg-champagne/40 rounded-xl" />
          <div className="h-14 bg-champagne/40 rounded-xl" />
        </div>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="p-6 bg-cream border-error-border space-y-4">
        <div className="flex items-center gap-2 border-b border-border/60 pb-3">
          <AlertCircle className="w-5 h-5 text-error" />
          <h2 className="font-heading text-lg font-bold text-emerald">Email Notifications</h2>
        </div>
        <p className="text-sm text-error">
          {error instanceof Error ? error.message : "Failed to load your notification preferences."}
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.location.reload()}
          className="gap-2"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Retry
        </Button>
      </Card>
    );
  }

  const jobAlerts = preferences?.jobAlerts ?? true;
  const applicantDigest = preferences?.applicantDigest ?? true;
  const profileNudges = preferences?.profileNudges ?? true;

  return (
    <Card className="p-6 bg-cream border-border space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-gold" />
          <h2 className="font-heading text-lg font-bold text-emerald">Email Notifications</h2>
        </div>
        {isUpdating && (
          <span className="text-xs text-muted font-medium animate-pulse">Saving changes...</span>
        )}
      </div>

      <p className="text-sm text-body/75">
        Manage which automated digests and updates Career OS sends to your verified email address.
      </p>

      <div className="space-y-5">
        {/* Candidate Option 1: Job Alerts */}
        {(isCandidate || isAdmin) && (
          <div className="flex items-start justify-between gap-4 p-4 rounded-xl bg-champagne/20 border border-border/60 transition-all hover:border-gold/50">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-emerald" />
                <label
                  htmlFor="pref-job-alerts"
                  className="text-sm font-semibold text-emerald cursor-pointer"
                >
                  Daily Job Alerts
                </label>
              </div>
              <p className="text-xs text-body/70 leading-relaxed">
                Receive a daily morning digest (9:00 AM IST) featuring new job listings that match
                your skills and target city.
              </p>
              <p className="text-[11px] text-muted italic">
                Note: Candidates who disable &quot;Open to Work&quot; on their profile automatically
                pause alerts.
              </p>
            </div>
            <ToggleSwitch
              id="pref-job-alerts"
              checked={jobAlerts}
              onChange={(val) => updatePreference("jobAlerts", val)}
              disabled={isUpdating}
            />
          </div>
        )}

        {/* Candidate Option 2: Profile Tips */}
        {(isCandidate || isAdmin) && (
          <div className="flex items-start justify-between gap-4 p-4 rounded-xl bg-champagne/20 border border-border/60 transition-all hover:border-gold/50">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald" />
                <label
                  htmlFor="pref-profile-nudges"
                  className="text-sm font-semibold text-emerald cursor-pointer"
                >
                  Weekly Profile Tips &amp; Nudges
                </label>
              </div>
              <p className="text-xs text-body/70 leading-relaxed">
                Receive recommendations on missing profile sections (skills, resume, projects) when
                your profile completeness is below 70%. Sent on Mondays (11:00 AM IST).
              </p>
            </div>
            <ToggleSwitch
              id="pref-profile-nudges"
              checked={profileNudges}
              onChange={(val) => updatePreference("profileNudges", val)}
              disabled={isUpdating}
            />
          </div>
        )}

        {/* Recruiter Option: Applicant Digest */}
        {(isRecruiter || isAdmin) && (
          <div className="flex items-start justify-between gap-4 p-4 rounded-xl bg-champagne/20 border border-border/60 transition-all hover:border-gold/50">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-emerald" />
                <label
                  htmlFor="pref-applicant-digest"
                  className="text-sm font-semibold text-emerald cursor-pointer"
                >
                  Daily Applicant Digest
                </label>
              </div>
              <p className="text-xs text-body/70 leading-relaxed">
                Receive a daily evening digest (6:00 PM IST) summarizing new candidate applications
                and pending reviews across all your active job postings.
              </p>
            </div>
            <ToggleSwitch
              id="pref-applicant-digest"
              checked={applicantDigest}
              onChange={(val) => updatePreference("applicantDigest", val)}
              disabled={isUpdating}
            />
          </div>
        )}
      </div>

      <div className="pt-2 text-xs text-muted border-t border-border/40">
        All emails contain 1-click unsubscribe links and respect your daily notification preferences.
      </div>
    </Card>
  );
};

