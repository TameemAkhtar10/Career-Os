"use client";

import React from "react";
import Link from "next/link";
import { Job } from "../../../types/job";
import { Badge } from "../../../components/ui/Badge";
import { Card } from "../../../components/ui/Card";
import { formatSalary } from "../utils";
import { MapPin, Briefcase, Sparkles } from "lucide-react";
import { WORK_MODE_LABELS, JOB_TYPE_LABELS } from "../../../constants/enums";
import { ROUTES } from "../../../constants/routes";

export interface JobCardProps {
  job: Job;
}

export const JobCard: React.FC<JobCardProps> = ({ job }) => {
  const locationText = [job.location?.city, job.location?.state]
    .filter(Boolean)
    .join(", ") || "Location";

  const workModeLabel = job.workMode ? WORK_MODE_LABELS[job.workMode] || job.workMode : "";
  const jobTypeLabel = job.jobType ? JOB_TYPE_LABELS[job.jobType] || job.jobType : "";

  return (
    <Link href={ROUTES.JOB_DETAIL(job._id)} className="block group">
      <Card hoverLift className="flex flex-col justify-between h-full bg-cream border-border/80">
        <div>
          {/* Top meta tags */}
          <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
            {job.isFresherFriendly ? (
              <Badge variant="fresher" size="sm" className="gap-1">
                <Sparkles className="w-3 h-3 text-gold" />
                Fresher friendly
              </Badge>
            ) : (
              <span />
            )}
            <Badge variant="outline" size="sm">
              {jobTypeLabel}
            </Badge>
          </div>

          {/* Job Title & Company */}
          <h3 className="font-fraunces text-lg sm:text-xl font-bold text-emerald-dark group-hover:text-gold transition-colors line-clamp-2">
            {job.title}
          </h3>
          <p className="text-xs font-semibold text-muted uppercase tracking-wider mt-1">
            {job.companyName}
          </p>

          {/* Location & Mode */}
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-body/80">
            <span className="inline-flex items-center gap-1 bg-champagne/60 px-2.5 py-1 rounded-ui border border-border/50">
              <MapPin className="w-3 h-3 text-emerald" />
              {locationText}
            </span>
            <span className="inline-flex items-center gap-1 bg-champagne/60 px-2.5 py-1 rounded-ui border border-border/50">
              <Briefcase className="w-3 h-3 text-emerald" />
              {workModeLabel}
            </span>
          </div>

          {/* Skills chips */}
          {job.skills && job.skills.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {job.skills.slice(0, 4).map((skill, i) => (
                <span
                  key={i}
                  className="text-[11px] bg-white/80 border border-border/40 text-body px-2 py-0.5 rounded-full"
                >
                  {skill}
                </span>
              ))}
              {job.skills.length > 4 && (
                <span className="text-[11px] text-muted self-center">
                  +{job.skills.length - 4} more
                </span>
              )}
            </div>
          )}
        </div>

        {/* Footer: Salary & View button */}
        <div className="mt-6 pt-4 border-t border-border/60 flex items-center justify-between">
          <div>
            <span className="block text-[10px] uppercase font-bold text-muted">
              Compensation
            </span>
            <span className="font-fraunces text-base font-bold text-emerald-dark">
              {formatSalary(job.salary)}
            </span>
          </div>

          <span className="text-xs font-semibold text-emerald bg-champagne px-3 py-1.5 rounded-ui border border-border/60 group-hover:bg-emerald group-hover:text-white transition-colors">
            View Role →
          </span>
        </div>
      </Card>
    </Link>
  );
};

