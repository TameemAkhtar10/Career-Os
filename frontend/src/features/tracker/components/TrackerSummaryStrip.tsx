import React from "react";
import { TrackerSummaryResponse } from "../types/tracker.types";
import Link from "next/link";

interface TrackerSummaryStripProps {
  summary: TrackerSummaryResponse | null;
  onFilterUpcoming?: () => void;
}

export const TrackerSummaryStrip: React.FC<TrackerSummaryStripProps> = ({
  summary,
}) => {
  if (!summary) return null;

  const { counts, upcomingFollowUps, upcomingInterviews, idleApplications } = summary;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-white border border-[#E8D3AA] rounded-xl p-4 shadow-sm">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#C8963E]">
          Active Applications
        </span>
        <div className="text-2xl font-bold text-[#064E3B] mt-1">
          {(counts.applied || 0) + (counts.screening || 0) + (counts.interview || 0)}
        </div>
        <p className="text-xs text-stone-500 mt-1">
          {counts.interview || 0} in interview • {counts.offer || 0} offers received
        </p>
      </div>

      <div className="bg-white border border-[#E8D3AA] rounded-xl p-4 shadow-sm">
        <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
          Interviews Scheduled
        </span>
        <div className="text-2xl font-bold text-emerald-800 mt-1">
          {upcomingInterviews.length}
        </div>
        <p className="text-xs text-stone-500 mt-1">
          {upcomingInterviews[0] ? (
            <span>Next: {upcomingInterviews[0].jobTitle}</span>
          ) : (
            "None upcoming this week"
          )}
        </p>
      </div>

      <div className="bg-white border border-[#E8D3AA] rounded-xl p-4 shadow-sm">
        <span className="text-xs font-semibold uppercase tracking-wider text-amber-700">
          Follow-ups Due
        </span>
        <div className="text-2xl font-bold text-amber-800 mt-1">
          {upcomingFollowUps.length}
        </div>
        <p className="text-xs text-stone-500 mt-1">
          {upcomingFollowUps[0] ? (
            <span>Due: {upcomingFollowUps[0].company}</span>
          ) : (
            "All follow-ups up to date"
          )}
        </p>
      </div>

      <div className="bg-white border border-[#E8D3AA] rounded-xl p-4 shadow-sm">
        <span className="text-xs font-semibold uppercase tracking-wider text-stone-600">
          Awaiting Response (14d+)
        </span>
        <div className="text-2xl font-bold text-stone-800 mt-1">
          {idleApplications.length}
        </div>
        <p className="text-xs text-stone-500 mt-1">
          {idleApplications.length > 0
            ? "Ready for a polite follow-up"
            : "No stalled applications"}
        </p>
      </div>
    </div>
  );
};
