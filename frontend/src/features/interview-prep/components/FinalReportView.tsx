import React from "react";
import {
  FinalReport,
  ReportStats,
  InterviewSessionItem,
  QuestionMix,
} from "../types/interviewPrep.types";
import {
  Download,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  Calendar,
  Sparkles,
  Bot,
  RefreshCw,
} from "lucide-react";

interface FinalReportViewProps {
  role: string;
  stats: ReportStats;
  report: FinalReport | null;
  aiAvailable: boolean;
  items: InterviewSessionItem[];
  loadingReport: boolean;
  downloadingPdf: boolean;
  savingSession: boolean;
  sessionSaved: boolean;
  onDownloadPdf: () => void;
  onSaveSession: () => void;
  onRetryReport: () => void;
  onPracticeWeakAreas: (mix: QuestionMix) => void;
  onStartNew: () => void;
}

export const FinalReportView: React.FC<FinalReportViewProps> = ({
  role,
  stats,
  report,
  aiAvailable,
  items,
  loadingReport,
  downloadingPdf,
  savingSession,
  sessionSaved,
  onDownloadPdf,
  onSaveSession,
  onRetryReport,
  onPracticeWeakAreas,
  onStartNew,
}) => {
  if (loadingReport) {
    return (
      <div className="bg-white border border-[#E8D3AA] rounded-2xl p-10 text-center space-y-3 shadow-xs">
        <Sparkles className="w-8 h-8 text-[#064E3B] mx-auto animate-spin" />
        <h3 className="text-base font-bold font-serif text-stone-900">
          Compiling your interview practice report...
        </h3>
        <p className="text-xs text-stone-500">
          Calculating category scores, project readiness, and a 7-day study plan.
        </p>
      </div>
    );
  }

  const avgScore = stats?.averageScore ?? null;
  const scorePct = avgScore !== null ? Math.round((avgScore / 5) * 100) : 0;

  const handleBiasWeakAreas = () => {
    const weakest = stats?.weakestAreas?.[0] || "skills";
    if (weakest === "project") {
      onPracticeWeakAreas({ project: 6, skills: 2, hr: 1 });
    } else if (weakest === "hr") {
      onPracticeWeakAreas({ project: 2, skills: 2, hr: 4 });
    } else {
      onPracticeWeakAreas({ project: 2, skills: 6, hr: 1 });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Top Actions */}
      <div className="bg-white border border-[#E8D3AA] rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#E6F4EA] text-[#064E3B] text-[11px] font-bold">
              Mock Interview Report • {role}
            </span>
            <h2 className="text-xl sm:text-2xl font-bold font-serif text-stone-900">
              {report?.headline || "Practice session summary"}
            </h2>
            {report?.summary && (
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed max-w-3xl">
                {report.summary}
              </p>
            )}
          </div>

          {/* Score Ring */}
          <div className="flex items-center gap-4 shrink-0 bg-[#FFF8EC] border border-[#E8D3AA] rounded-2xl p-4">
            <div className="relative w-16 h-16 flex items-center justify-center rounded-full border-4 border-[#064E3B] bg-white">
              <div className="text-center">
                <span className="text-base font-bold text-[#064E3B] block leading-none">
                  {avgScore !== null ? avgScore : "—"}
                </span>
                <span className="text-[10px] text-stone-500">/ 5</span>
              </div>
            </div>
            <div className="text-xs space-y-0.5">
              <p className="font-bold text-stone-900">Own-Answer Score ({scorePct}%)</p>
              <p className="text-stone-600">Answered: {stats.answeredCount}</p>
              <p className="text-amber-700">AI-assisted: {stats.aiAssistedCount}</p>
              <p className="text-stone-500">Skipped: {stats.skippedCount}</p>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex flex-wrap items-center gap-2.5 pt-3 border-t border-stone-100">
          <button
            type="button"
            onClick={onDownloadPdf}
            disabled={downloadingPdf}
            className="px-4 py-2 rounded-lg bg-[#064E3B] hover:bg-[#032E23] text-white text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{downloadingPdf ? "Preparing PDF..." : "Download PDF"}</span>
          </button>

          <button
            type="button"
            onClick={onSaveSession}
            disabled={savingSession || sessionSaved}
            className="px-4 py-2 rounded-lg border border-[#064E3B] text-[#064E3B] hover:bg-[#E6F4EA] text-xs font-semibold flex items-center gap-1.5 disabled:opacity-60"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{sessionSaved ? "Session Saved" : savingSession ? "Saving..." : "Save session"}</span>
          </button>

          <button
            type="button"
            onClick={handleBiasWeakAreas}
            className="px-4 py-2 rounded-lg bg-[#FFF8EC] border border-[#C8963E] text-[#064E3B] hover:bg-[#F8E7C9] text-xs font-semibold flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Practice weak areas again</span>
          </button>

          <button
            type="button"
            onClick={onStartNew}
            className="px-3.5 py-2 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 text-xs font-medium ml-auto"
          >
            New Session
          </button>
        </div>

        {!aiAvailable && (
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex flex-wrap items-center justify-between gap-2 text-xs text-amber-900">
            <span>
              AI report narrative could not be generated right now, so deterministic stats are shown below.
            </span>
            <button
              type="button"
              onClick={onRetryReport}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-amber-900 text-white font-semibold hover:bg-amber-800"
            >
              <RefreshCw className="w-3 h-3" /> Retry AI Report
            </button>
          </div>
        )}
      </div>

      {/* Category Bars */}
      {Object.keys(stats.categoryAverages || {}).length > 0 && (
        <div className="bg-white border border-[#E8D3AA] rounded-2xl p-5 shadow-xs space-y-3">
          <h3 className="text-sm font-bold font-serif text-stone-900">Category Breakdown</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {Object.entries(stats.categoryAverages).map(([cat, data]) => {
              const pct = data.average !== null ? Math.round((data.average / 5) * 100) : 0;
              return (
                <div key={cat} className="p-3 rounded-xl bg-stone-50 border border-stone-200/80 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold capitalize text-stone-800">{cat}</span>
                    <span className="font-mono font-semibold text-[#064E3B]">
                      {data.average !== null ? `${data.average}/5` : "—"}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-stone-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#064E3B] rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-stone-500">
                    {data.answeredCount} answered • {data.aiAssistedCount} AI • {data.skippedCount} skipped
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Strengths & Weak Areas */}
      {report && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-[#E8D3AA] rounded-2xl p-5 shadow-xs space-y-3">
            <h3 className="text-sm font-bold font-serif text-[#064E3B] flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>Strengths (Own Answers Only)</span>
            </h3>
            {report.strengths && report.strengths.length > 0 ? (
              <ul className="text-xs text-stone-700 space-y-2 pl-4">
                {report.strengths.map((s, idx) => (
                  <li key={idx} className="list-disc leading-relaxed">
                    {s}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-stone-500 italic">
                No independent answers were scored yet. Answer questions in your own words to highlight strengths.
              </p>
            )}
          </div>

          <div className="bg-white border border-[#E8D3AA] rounded-2xl p-5 shadow-xs space-y-3">
            <h3 className="text-sm font-bold font-serif text-amber-800 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" />
              <span>Weak Areas &amp; Concrete Fixes</span>
            </h3>
            {report.weakAreas && report.weakAreas.length > 0 ? (
              <div className="space-y-2.5">
                {report.weakAreas.map((w, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-amber-50/50 border border-amber-200/70 text-xs space-y-1">
                    <p className="font-bold text-stone-900">
                      {w.area} {w.relatedTo ? `(${w.relatedTo})` : ""}
                    </p>
                    {w.whyItMatters && <p className="text-stone-600">{w.whyItMatters}</p>}
                    {w.fix && (
                      <p className="text-[#064E3B] font-medium">Fix: {w.fix}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-stone-500">No major weak areas flagged.</p>
            )}
          </div>
        </div>
      )}

      {/* Project Readiness & Answer Habits */}
      {report && (report.projectReadiness?.length > 0 || report.answerHabits?.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {report.projectReadiness?.length > 0 && (
            <div className="bg-white border border-[#E8D3AA] rounded-2xl p-5 shadow-xs space-y-3">
              <h3 className="text-sm font-bold font-serif text-stone-900">Project Readiness</h3>
              <div className="space-y-2">
                {report.projectReadiness.map((pr, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-[#FFF8EC] border border-[#E8D3AA] text-xs">
                    <div className="flex items-center justify-between font-bold text-stone-900 mb-1">
                      <span>{pr.project}</span>
                      {pr.score !== null && <span className="text-[#064E3B]">{pr.score}/5</span>}
                    </div>
                    <p className="text-stone-600">{pr.note}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {report.answerHabits?.length > 0 && (
            <div className="bg-white border border-[#E8D3AA] rounded-2xl p-5 shadow-xs space-y-3">
              <h3 className="text-sm font-bold font-serif text-stone-900">Answer Habits</h3>
              <ul className="text-xs text-stone-700 space-y-1.5 pl-4">
                {report.answerHabits.map((habit, idx) => (
                  <li key={idx} className="list-disc">
                    {habit}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Topics to Study Table */}
      {report?.topicsToStudy && report.topicsToStudy.length > 0 && (
        <div className="bg-white border border-[#E8D3AA] rounded-2xl p-5 shadow-xs space-y-3">
          <h3 className="text-sm font-bold font-serif text-stone-900 flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-[#064E3B]" />
            <span>Topics to Study</span>
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-stone-200 text-stone-500">
                  <th className="py-2 pr-3 font-semibold">Topic</th>
                  <th className="py-2 pr-3 font-semibold">Why</th>
                  <th className="py-2 font-semibold">Concrete Exercise</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {report.topicsToStudy.map((t, idx) => (
                  <tr key={idx}>
                    <td className="py-2.5 pr-3 font-bold text-stone-900 align-top">{t.topic}</td>
                    <td className="py-2.5 pr-3 text-stone-600 align-top">{t.reason}</td>
                    <td className="py-2.5 text-[#064E3B] align-top">{t.practice}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 7-Day Plan */}
      {report?.nextSteps && report.nextSteps.length > 0 && (
        <div className="bg-[#FFF8EC] border border-[#E8D3AA] rounded-2xl p-5 shadow-xs space-y-3">
          <h3 className="text-sm font-bold font-serif text-[#064E3B] flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            <span>7-Day Preparation Plan</span>
          </h3>
          <div className="space-y-2">
            {report.nextSteps.map((step, idx) => (
              <div key={idx} className="bg-white border border-[#E8D3AA] rounded-xl p-3 text-xs text-stone-700">
                {step}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Per-Question Breakdown Table */}
      <div className="bg-white border border-[#E8D3AA] rounded-2xl p-5 shadow-xs space-y-3">
        <h3 className="text-sm font-bold font-serif text-stone-900">Per-Question Breakdown</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-stone-200 text-stone-500">
                <th className="py-2 pr-3 font-semibold">#</th>
                <th className="py-2 pr-3 font-semibold">Question</th>
                <th className="py-2 pr-3 font-semibold">Status / Mode</th>
                <th className="py-2 font-semibold">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {items.map((item, idx) => (
                <tr key={idx}>
                  <td className="py-2.5 pr-3 text-stone-500 align-top">{idx + 1}</td>
                  <td className="py-2.5 pr-3 align-top">
                    <p className="font-semibold text-stone-900">{item.question}</p>
                    {item.relatedTo && (
                      <span className="text-[11px] text-stone-500">
                        {item.category} • {item.relatedTo}
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 pr-3 align-top">
                    {item.skipped ? (
                      <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 text-[10px] font-semibold">
                        Skipped
                      </span>
                    ) : item.usedAiAnswer ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-semibold">
                        <Bot className="w-3 h-3" /> AI-assisted
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-[#E6F4EA] text-[#064E3B] text-[10px] font-semibold">
                        Own answer
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 font-bold text-stone-800 align-top">
                    {item.skipped || item.usedAiAnswer
                      ? "—"
                      : item.score !== null
                      ? `${item.score}/5`
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-stone-500 italic pt-2 border-t border-stone-100">
          Practice report generated by Career OS. An estimate to help you prepare.
        </p>
      </div>
    </div>
  );
};
