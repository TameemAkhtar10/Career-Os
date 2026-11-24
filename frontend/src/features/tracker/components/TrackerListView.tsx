import React from "react";
import { TrackerEntry, TrackerStage } from "../types/tracker.types";
import { Lock, ExternalLink, Calendar, MoreHorizontal } from "lucide-react";

interface TrackerListViewProps {
  entries: TrackerEntry[];
  onEdit: (entry: TrackerEntry) => void;
  onDelete: (id: string) => void;
  onUpdateStage: (id: string, stage: TrackerStage) => void;
}

const STAGE_LABELS: Record<TrackerStage, { label: string; badge: string }> = {
  saved: { label: "Saved", badge: "bg-stone-100 text-stone-700" },
  applied: { label: "Applied", badge: "bg-blue-100 text-blue-800" },
  screening: { label: "Screening", badge: "bg-purple-100 text-purple-800" },
  interview: { label: "Interview", badge: "bg-emerald-100 text-emerald-800" },
  offer: { label: "Offer", badge: "bg-amber-100 text-amber-800" },
  rejected: { label: "Rejected", badge: "bg-rose-100 text-rose-800" },
  withdrawn: { label: "Withdrawn", badge: "bg-stone-100 text-stone-600" },
};

export const TrackerListView: React.FC<TrackerListViewProps> = ({
  entries,
  onEdit,
  onDelete,
  onUpdateStage,
}) => {
  if (entries.length === 0) {
    return (
      <div className="bg-white border border-[#E8D3AA] rounded-xl p-12 text-center">
        <p className="text-stone-500 text-sm">No applications found matching your filters.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#E8D3AA] rounded-xl overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-stone-700">
          <thead className="bg-[#FFF8EC] border-b border-[#E8D3AA] text-xs font-semibold uppercase text-stone-600">
            <tr>
              <th className="py-3 px-4">Role & Company</th>
              <th className="py-3 px-4">Stage</th>
              <th className="py-3 px-4">Source</th>
              <th className="py-3 px-4">Applied Date</th>
              <th className="py-3 px-4">Upcoming Schedule</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {entries.map((entry) => {
              const isPlatform = entry.source === "platform";
              const stageInfo = STAGE_LABELS[entry.stage] || {
                label: entry.stage,
                badge: "bg-stone-100 text-stone-700",
              };

              return (
                <tr key={entry._id} className="hover:bg-stone-50/70 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-medium text-stone-900">{entry.jobTitle}</div>
                    <div className="text-xs text-stone-500">
                      {entry.company} {entry.location && `• ${entry.location}`}
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    {isPlatform ? (
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${stageInfo.badge}`}
                        title="Recruiter controlled status"
                      >
                        {stageInfo.label}
                      </span>
                    ) : (
                      <select
                        value={entry.stage}
                        onChange={(e) =>
                          onUpdateStage(entry._id, e.target.value as TrackerStage)
                        }
                        className="text-xs font-medium border border-stone-200 rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-[#064E3B]"
                      >
                        <option value="saved">Saved</option>
                        <option value="applied">Applied</option>
                        <option value="screening">Screening</option>
                        <option value="interview">Interview</option>
                        <option value="offer">Offer</option>
                        <option value="rejected">Rejected</option>
                        <option value="withdrawn">Withdrawn</option>
                      </select>
                    )}
                  </td>

                  <td className="py-3 px-4 text-xs">
                    {isPlatform ? (
                      <span className="inline-flex items-center gap-1 text-[#064E3B] font-medium">
                        <Lock className="w-3 h-3" /> Career OS
                      </span>
                    ) : (
                      <span className="text-stone-500">External</span>
                    )}
                  </td>

                  <td className="py-3 px-4 text-xs text-stone-500">
                    {entry.appliedOn
                      ? new Date(entry.appliedOn).toLocaleDateString("en-IN", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })
                      : "—"}
                  </td>

                  <td className="py-3 px-4 text-xs">
                    {entry.interviewAt ? (
                      <span className="text-emerald-700 font-medium flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(entry.interviewAt).toLocaleDateString("en-IN", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    ) : entry.followUpAt ? (
                      <span className="text-amber-700 font-medium">
                        Follow-up:{" "}
                        {new Date(entry.followUpAt).toLocaleDateString("en-IN", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    ) : (
                      <span className="text-stone-400">—</span>
                    )}
                  </td>

                  <td className="py-3 px-4 text-right space-x-2">
                    <button
                      onClick={() => onEdit(entry)}
                      className="text-xs font-medium text-[#064E3B] hover:underline"
                    >
                      Edit
                    </button>
                    {!isPlatform && (
                      <button
                        onClick={() => onDelete(entry._id)}
                        className="text-xs font-medium text-rose-600 hover:underline"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
