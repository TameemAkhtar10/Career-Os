import React from "react";
import { InterviewSession } from "../types/interviewPrep.types";
import { Trash2, Calendar, Star, Clock } from "lucide-react";

interface HistoryTabProps {
  sessions: InterviewSession[];
  onDeleteSession: (id: string) => void;
  loading: boolean;
}

export const HistoryTab: React.FC<HistoryTabProps> = ({
  sessions,
  onDeleteSession,
  loading,
}) => {
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
          Complete and finish a practice session to save your answers and coaching feedback history here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sessions.map((sess) => {
        const avgScore =
          sess.items.length > 0
            ? (
                sess.items.reduce((acc, curr) => acc + (curr.score || 0), 0) /
                sess.items.length
              ).toFixed(1)
            : null;

        return (
          <div
            key={sess._id}
            className="bg-white border border-[#E8D3AA] rounded-2xl p-5 shadow-xs"
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <h4 className="font-bold text-stone-900 text-sm font-serif">
                  {sess.role}
                </h4>
                <div className="flex items-center gap-2 text-xs text-stone-500 mt-0.5">
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

              <div className="flex items-center gap-3">
                {avgScore && (
                  <div className="flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    <span>Avg {avgScore}/5</span>
                  </div>
                )}
                <button
                  onClick={() => onDeleteSession(sess._id)}
                  className="p-1.5 text-stone-400 hover:text-rose-600 rounded"
                  title="Delete session"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-2 mt-4 pt-3 border-t border-stone-100">
              {sess.items.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-stone-50 p-3 rounded-xl border border-stone-100 text-xs"
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="font-semibold text-stone-800">
                      {idx + 1}. {item.question}
                    </span>
                    {item.score && (
                      <span className="font-bold text-emerald-800 shrink-0">
                        {item.score}/5
                      </span>
                    )}
                  </div>
                  {item.answer && (
                    <p className="text-stone-600 italic line-clamp-2">
                      "{item.answer}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};
