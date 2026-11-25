import React, { useState } from "react";
import { InterviewSession } from "../types/interviewPrep.types";
import { Trash2, Calendar, Star, Eye, ChevronDown, ChevronUp, Bot } from "lucide-react";

interface HistoryTabProps {
  sessions: InterviewSession[];
  onDeleteSession: (id: string) => Promise<void> | void;
  onDeleteAllSessions: () => Promise<void> | void;
  loading: boolean;
}

export const HistoryTab: React.FC<HistoryTabProps> = ({
  sessions,
  onDeleteSession,
  onDeleteAllSessions,
  loading,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmClearAll, setConfirmClearAll] = useState(false);

  if (loading) {
    return (
      <div className="p-12 text-center text-xs text-stone-400">
        Loading past interview sessions...
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="bg-white border border-[#E8D3AA] rounded-2xl p-12 text-center">
        <h4 className="text-sm font-semibold text-stone-800 mb-1">
          No saved interview practice sessions
        </h4>
        <p className="text-xs text-stone-500">
          Complete a mock interview and save your report to review your answers and progress here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs text-stone-500">
          Showing {sessions.length} saved session{sessions.length === 1 ? "" : "s"} (max 50)
        </span>
        {!confirmClearAll ? (
          <button
            type="button"
            onClick={() => setConfirmClearAll(true)}
            className="text-xs font-semibold text-rose-600 hover:underline flex items-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete all sessions
          </button>
        ) : (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-rose-700 font-medium">Delete all saved sessions?</span>
            <button
              type="button"
              onClick={async () => {
                await onDeleteAllSessions();
                setConfirmClearAll(false);
              }}
              className="px-2.5 py-1 rounded bg-rose-600 text-white font-semibold"
            >
              Confirm
            </button>
            <button
              type="button"
              onClick={() => setConfirmClearAll(false)}
              className="px-2.5 py-1 rounded border border-stone-200 text-stone-600"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {sessions.map((sess) => {
        const scored = sess.items.filter(
          (i) => !i.skipped && !i.usedAiAnswer && typeof i.score === "number"
        );
        const avgScore =
          sess.stats?.averageScore !== undefined && sess.stats?.averageScore !== null
            ? sess.stats.averageScore
            : scored.length > 0
            ? Number(
                (scored.reduce((acc, curr) => acc + (curr.score || 0), 0) / scored.length).toFixed(1)
              )
            : null;

        const isExpanded = expandedId === sess._id;

        return (
          <div
            key={sess._id}
            className="bg-white border border-[#E8D3AA] rounded-2xl p-5 shadow-xs"
          >
            <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
              <div>
                <h4 className="font-bold text-stone-900 text-sm font-serif">
                  {sess.role}
                </h4>
                <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500 mt-0.5">
                  <span className="capitalize">{sess.focus} focus</span>
                  <span>•</span>
                  <span className="capitalize">{sess.level}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(sess.createdAt).toLocaleDateString("en-IN", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {avgScore !== null && (
                  <div className="flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    <span>Avg {avgScore}/5</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : sess._id)}
                  className="px-2.5 py-1 rounded-lg border border-stone-200 text-xs font-semibold text-[#064E3B] hover:bg-[#E6F4EA]/50 flex items-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{isExpanded ? "Hide details" : "View report"}</span>
                  {isExpanded ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>

                {confirmDeleteId === sess._id ? (
                  <div className="flex items-center gap-1 text-xs">
                    <button
                      type="button"
                      onClick={async () => {
                        await onDeleteSession(sess._id);
                        setConfirmDeleteId(null);
                      }}
                      className="px-2 py-1 rounded bg-rose-600 text-white font-semibold"
                    >
                      Delete
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(null)}
                      className="px-2 py-1 rounded border border-stone-200 text-stone-600"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(sess._id)}
                    className="p-1.5 text-stone-400 hover:text-rose-600 rounded"
                    title="Delete session"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {sess.report?.headline && (
              <p className="text-xs text-stone-700 bg-[#FFF8EC] border border-[#E8D3AA] rounded-xl p-3 mb-3">
                <strong>Summary:</strong> {sess.report.headline}
              </p>
            )}

            {isExpanded && (
              <div className="space-y-4 mt-4 pt-3 border-t border-stone-100">
                {sess.report && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    {sess.report.strengths?.length > 0 && (
                      <div className="p-3 rounded-xl bg-[#E6F4EA]/50 border border-[#064E3B]/20">
                        <strong className="text-[#064E3B] block mb-1">Strengths</strong>
                        <ul className="list-disc pl-4 space-y-1 text-stone-700">
                          {sess.report.strengths.map((s, i) => (
                            <li key={i}>{s}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {sess.report.nextSteps?.length > 0 && (
                      <div className="p-3 rounded-xl bg-[#FFF8EC] border border-[#E8D3AA]">
                        <strong className="text-[#064E3B] block mb-1">7-Day Plan</strong>
                        <ul className="list-disc pl-4 space-y-1 text-stone-700">
                          {sess.report.nextSteps.map((step, i) => (
                            <li key={i}>{step}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  {sess.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-stone-50 p-3 rounded-xl border border-stone-100 text-xs space-y-1"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-semibold text-stone-800">
                          {idx + 1}. {item.question}
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {item.usedAiAnswer && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-semibold">
                              <Bot className="w-3 h-3" /> AI-assisted
                            </span>
                          )}
                          {item.skipped && (
                            <span className="px-2 py-0.5 rounded-full bg-stone-200 text-stone-600 text-[10px] font-semibold">
                              Skipped
                            </span>
                          )}
                          {!item.skipped && !item.usedAiAnswer && item.score && (
                            <span className="font-bold text-emerald-800">
                              {item.score}/5
                            </span>
                          )}
                        </div>
                      </div>
                      {item.answer && !item.usedAiAnswer && (
                        <p className="text-stone-600 italic">&quot;{item.answer}&quot;</p>
                      )}
                      {item.betterAnswer && (
                        <p className="text-stone-600 bg-white p-2 rounded border border-stone-200/70">
                          <strong>Sample answer:</strong> {item.betterAnswer}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
