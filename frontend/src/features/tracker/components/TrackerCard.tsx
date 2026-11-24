import React, { useState } from "react";
import { TrackerEntry, TrackerStage } from "../types/tracker.types";
import {
  Building2,
  Calendar,
  Clock,
  ExternalLink,
  Lock,
  MoreVertical,
  CheckCircle2,
  AlertCircle,
  FileEdit,
  Trash2,
} from "lucide-react";

interface TrackerCardProps {
  entry: TrackerEntry;
  onEdit: (entry: TrackerEntry) => void;
  onDelete: (id: string) => void;
  onSnooze: (id: string) => void;
  onMarkDone: (id: string) => void;
  onMoveStage?: (id: string, stage: TrackerStage) => void;
}

export const TrackerCard: React.FC<TrackerCardProps> = ({
  entry,
  onEdit,
  onDelete,
  onSnooze,
  onMarkDone,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const isPlatform = entry.source === "platform";

  const isFollowUpDue =
    entry.followUpAt && new Date(entry.followUpAt).getTime() <= Date.now() + 24 * 60 * 60 * 1000;
  const isInterviewSoon =
    entry.interviewAt && new Date(entry.interviewAt).getTime() >= Date.now();

  return (
    <div className="bg-white border border-[#E8D3AA] hover:border-[#C8963E] rounded-xl p-4 shadow-xs transition-all relative group">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h4 className="font-semibold text-stone-900 text-sm truncate">
              {entry.jobTitle}
            </h4>
            {isPlatform ? (
              <span
                title="Platform Application (Stage synced with recruiter)"
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#F8E7C9] text-[#064E3B]"
              >
                <Lock className="w-2.5 h-2.5" />
                Career OS
              </span>
            ) : (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-stone-100 text-stone-600">
                External
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 text-xs text-stone-600 mt-1">
            <Building2 className="w-3.5 h-3.5 text-stone-400 shrink-0" />
            <span className="truncate">{entry.company}</span>
            {entry.location && (
              <>
                <span>•</span>
                <span className="truncate text-stone-500">{entry.location}</span>
              </>
            )}
          </div>
        </div>

        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1 text-stone-400 hover:text-stone-700 rounded hover:bg-stone-100"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-6 w-36 bg-white border border-stone-200 rounded-lg shadow-lg z-20 py-1 text-xs">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onEdit(entry);
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-stone-50 flex items-center gap-1.5 text-stone-700"
              >
                <FileEdit className="w-3.5 h-3.5" /> Edit Details
              </button>
              {entry.followUpAt && (
                <>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onSnooze(entry._id);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-stone-50 flex items-center gap-1.5 text-amber-700"
                  >
                    <Clock className="w-3.5 h-3.5" /> Snooze 3 days
                  </button>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onMarkDone(entry._id);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-stone-50 flex items-center gap-1.5 text-emerald-700"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Done
                  </button>
                </>
              )}
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onDelete(entry._id);
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-red-50 flex items-center gap-1.5 text-red-600"
              >
                <Trash2 className="w-3.5 h-3.5" /> {isPlatform ? "Hide" : "Delete"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Timing alerts */}
      <div className="mt-3 space-y-1.5">
        {isInterviewSoon && (
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-800 bg-emerald-50 px-2 py-1 rounded">
            <Calendar className="w-3.5 h-3.5 text-emerald-600" />
            <span>
              Interview: {new Date(entry.interviewAt!).toLocaleDateString("en-IN", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        )}

        {isFollowUpDue && (
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-amber-800 bg-amber-50 px-2 py-1 rounded">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
            <span>Follow-up due soon</span>
          </div>
        )}

        {entry.salaryNote && (
          <div className="text-[11px] text-stone-500 font-mono">
            Comp: {entry.salaryNote}
          </div>
        )}

        {entry.notes && (
          <p className="text-xs text-stone-600 line-clamp-2 mt-1 italic">
            "{entry.notes}"
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="mt-3 pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-400">
        <span>
          {entry.appliedOn
            ? `Applied ${new Date(entry.appliedOn).toLocaleDateString("en-IN", {
                month: "short",
                day: "numeric",
              })}`
            : "Not applied yet"}
        </span>

        {entry.link && (
          <a
            href={entry.link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#064E3B] hover:text-[#032E23] flex items-center gap-0.5 font-medium"
          >
            <span>Link</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </div>
  );
};
