import React from "react";
import { TrackerEntry, TrackerStage } from "../types/tracker.types";
import { TrackerCard } from "./TrackerCard";

interface TrackerBoardViewProps {
  entries: TrackerEntry[];
  onEdit: (entry: TrackerEntry) => void;
  onDelete: (id: string) => void;
  onSnooze: (id: string) => void;
  onMarkDone: (id: string) => void;
}

const COLUMNS: { stage: TrackerStage; label: string; bg: string; badge: string }[] = [
  { stage: "saved", label: "Saved / Bookmarked", bg: "bg-stone-50", badge: "bg-stone-200 text-stone-700" },
  { stage: "applied", label: "Applied", bg: "bg-blue-50/40", badge: "bg-blue-100 text-blue-800" },
  { stage: "screening", label: "Screening / Assignment", bg: "bg-purple-50/40", badge: "bg-purple-100 text-purple-800" },
  { stage: "interview", label: "Interview", bg: "bg-emerald-50/40", badge: "bg-emerald-100 text-emerald-800" },
  { stage: "offer", label: "Offer Received", bg: "bg-amber-50/40", badge: "bg-amber-100 text-amber-800" },
  { stage: "rejected", label: "Archived / Rejected", bg: "bg-stone-50/50", badge: "bg-stone-200 text-stone-600" },
];

export const TrackerBoardView: React.FC<TrackerBoardViewProps> = ({
  entries,
  onEdit,
  onDelete,
  onSnooze,
  onMarkDone,
}) => {
  return (
    <div className="flex gap-4 overflow-x-auto pb-6 pt-2">
      {COLUMNS.map((col) => {
        const columnEntries = entries.filter((e) => e.stage === col.stage);

        return (
          <div
            key={col.stage}
            className={`min-w-[280px] w-[300px] rounded-xl border border-stone-200 ${col.bg} p-3 flex flex-col shrink-0`}
          >
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="font-semibold text-stone-800 text-xs uppercase tracking-wider">
                {col.label}
              </span>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${col.badge}`}
              >
                {columnEntries.length}
              </span>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto max-h-[calc(100vh-320px)] pr-1">
              {columnEntries.length === 0 ? (
                <div className="h-24 border-2 border-dashed border-stone-200 rounded-lg flex items-center justify-center text-xs text-stone-400">
                  No applications
                </div>
              ) : (
                columnEntries.map((entry) => (
                  <TrackerCard
                    key={entry._id}
                    entry={entry}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onSnooze={onSnooze}
                    onMarkDone={onMarkDone}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
