import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  BookOpen,
  Target,
  FileText,
  Briefcase,
  Minus,
  Plus,
  ShieldCheck,
  Upload,
} from "lucide-react";
import { QuestionMix, QuestionSource, QuotaInfo } from "../types/interviewPrep.types";
import { ROUTES } from "@/constants/routes";

interface SetupPanelProps {
  onStartCustom: (params: {
    role: string;
    focus: string;
    level: string;
    source: QuestionSource;
    mix: QuestionMix;
  }) => void;
  onStartBasics: () => void;
  loading: boolean;
  initialRole?: string;
  hasResume: boolean;
  quota: QuotaInfo | null;
  initialMix?: QuestionMix;
}

export const SetupPanel: React.FC<SetupPanelProps> = ({
  onStartCustom,
  onStartBasics,
  loading,
  initialRole = "",
  hasResume,
  quota,
  initialMix,
}) => {
  const [role, setRole] = useState(initialRole || "Junior Software Developer");
  const [focus, setFocus] = useState("mixed");
  const [level, setLevel] = useState("fresher");
  const [source, setSource] = useState<QuestionSource>(
    hasResume ? "profile_resume" : "role_only"
  );
  const [mix, setMix] = useState<QuestionMix>(
    initialMix || { project: 5, skills: 3, hr: 2 }
  );

  useEffect(() => {
    setSource(hasResume ? "profile_resume" : "role_only");
  }, [hasResume]);

  useEffect(() => {
    if (initialMix) setMix(initialMix);
  }, [initialMix]);

  const totalQuestions = mix.project + mix.skills + mix.hr;
  const isMixValid = totalQuestions >= 5 && totalQuestions <= 12;

  const adjustMix = (key: keyof QuestionMix, delta: number, maxVal: number) => {
    setMix((prev) => {
      const nextVal = Math.max(0, Math.min(maxVal, prev[key] + delta));
      const nextTotal =
        (key === "project" ? nextVal : prev.project) +
        (key === "skills" ? nextVal : prev.skills) +
        (key === "hr" ? nextVal : prev.hr);
      if (nextTotal > 12 || nextTotal < 1) return prev;
      return { ...prev, [key]: nextVal };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!role.trim() || !isMixValid) return;
    onStartCustom({
      role: role.trim(),
      focus,
      level,
      source,
      mix,
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* AI Tailored Interview */}
      <div className="md:col-span-2 bg-white border border-[#E8D3AA] rounded-2xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-[#E6F4EA] text-[#064E3B]">
              <Sparkles className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-stone-900 font-serif">
              Resume-Driven Mock Interview
            </h2>
          </div>
          {quota && (
            <span className="text-[11px] font-mono font-semibold px-2.5 py-1 rounded-full bg-[#FFF8EC] border border-[#E8D3AA] text-[#064E3B]">
              AI uses today: {quota.used} / {quota.limit}
            </span>
          )}
        </div>
        <p className="text-xs text-stone-600 mb-5">
          Practice questions grounded in your actual resume projects and target role, with follow-up probing, AI sample answers when stuck, and a downloadable final report.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Source Selector */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              Question Source
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                disabled={!hasResume}
                onClick={() => setSource("profile_resume")}
                className={`text-left p-3 rounded-xl border transition-all flex items-start gap-2.5 ${
                  source === "profile_resume"
                    ? "border-[#064E3B] bg-[#E6F4EA]/50 ring-1 ring-[#064E3B]"
                    : "border-stone-200 bg-white hover:bg-stone-50"
                } ${!hasResume ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <FileText className="w-4 h-4 text-[#064E3B] shrink-0 mt-0.5" />
                <div>
                  <span className="block text-xs font-bold text-stone-900">
                    Use my profile resume
                  </span>
                  <span className="block text-[11px] text-stone-500 mt-0.5">
                    Only redacted text (no name, email, phone, or links) is sent.
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSource("role_only")}
                className={`text-left p-3 rounded-xl border transition-all flex items-start gap-2.5 ${
                  source === "role_only"
                    ? "border-[#064E3B] bg-[#E6F4EA]/50 ring-1 ring-[#064E3B]"
                    : "border-stone-200 bg-white hover:bg-stone-50"
                }`}
              >
                <Briefcase className="w-4 h-4 text-[#064E3B] shrink-0 mt-0.5" />
                <div>
                  <span className="block text-xs font-bold text-stone-900">
                    Role-only mode
                  </span>
                  <span className="block text-[11px] text-stone-500 mt-0.5">
                    Generate questions from the target role &amp; job skills only.
                  </span>
                </div>
              </button>
            </div>

            {!hasResume && (
              <div className="mt-2 p-3 rounded-xl bg-[#FFF8EC] border border-[#E8D3AA] flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="text-stone-700">
                  No uploaded resume found yet. Upload one or build one to unlock project-specific questions.
                </span>
                <div className="flex items-center gap-2">
                  <Link
                    href={ROUTES.CANDIDATE.PROFILE}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#064E3B] text-white font-semibold text-[11px] hover:bg-[#032E23]"
                  >
                    <Upload className="w-3 h-3" /> Upload Resume
                  </Link>
                  <Link
                    href={ROUTES.CANDIDATE.RESUME_BUILDER}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[#064E3B] text-[#064E3B] font-semibold text-[11px] hover:bg-white"
                  >
                    Resume Builder
                  </Link>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Target Job Title / Tech Stack
            </label>
            <input
              type="text"
              required
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. React Developer, Backend Engineer (Node/Python), Trainee..."
              className="w-full text-sm border border-stone-200 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-[#064E3B] focus:outline-none"
            />
          </div>

          {/* Question Mix Steppers */}
          <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-800">
                Question Mix (5 to 12 total)
              </span>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  isMixValid
                    ? "bg-[#E6F4EA] text-[#064E3B]"
                    : "bg-rose-100 text-rose-700"
                }`}
              >
                Total: {totalQuestions} questions
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {(
                [
                  { key: "project", label: "Project", max: 10 },
                  { key: "skills", label: "Skills", max: 10 },
                  { key: "hr", label: "HR", max: 6 },
                ] as const
              ).map(({ key, label, max }) => (
                <div
                  key={key}
                  className="bg-white border border-stone-200 rounded-lg p-2 flex items-center justify-between"
                >
                  <span className="text-xs font-medium text-stone-700">{label}</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => adjustMix(key, -1, max)}
                      className="w-6 h-6 rounded bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-700"
                      aria-label={`Decrease ${label} questions`}
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-xs font-bold w-4 text-center">{mix[key]}</span>
                    <button
                      type="button"
                      onClick={() => adjustMix(key, 1, max)}
                      className="w-6 h-6 rounded bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-700"
                      aria-label={`Increase ${label} questions`}
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {!isMixValid && (
              <p className="text-[11px] text-rose-600">
                Please select between 5 and 12 questions in total.
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Interview Focus
              </label>
              <select
                value={focus}
                onChange={(e) => setFocus(e.target.value)}
                className="w-full text-sm border border-stone-200 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-[#064E3B] focus:outline-none"
              >
                <option value="mixed">Mixed (Projects + Skills + HR)</option>
                <option value="technical">Core Technical &amp; Problem Solving</option>
                <option value="hr">HR &amp; Cultural Alignment</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Experience Level
              </label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full text-sm border border-stone-200 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-[#064E3B] focus:outline-none"
              >
                <option value="fresher">Fresher (2024–2026 Batch / 0 YOE)</option>
                <option value="junior">Junior Developer (1–2 YOE)</option>
              </select>
            </div>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
            <button
              type="submit"
              disabled={loading || !isMixValid}
              className="w-full sm:w-auto px-6 py-2.5 bg-[#064E3B] hover:bg-[#032E23] text-white text-sm font-semibold rounded-lg shadow-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Target className="w-4 h-4" />
              <span>{loading ? "Preparing mock interview..." : "Start mock interview"}</span>
            </button>

            <span className="text-[11px] text-stone-500 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#064E3B]" />
              Redacted resume only; zero raw text stored.
            </span>
          </div>
        </form>
      </div>

      {/* Static Basics Card */}
      <div className="bg-[#FFF8EC] border border-[#E8D3AA] rounded-2xl p-5 sm:p-6 flex flex-col justify-between shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-2 text-[#064E3B]">
            <BookOpen className="w-5 h-5" />
            <h3 className="text-base font-bold font-serif">Foundational 12 Questions</h3>
          </div>
          <p className="text-xs text-stone-600 leading-relaxed mb-4">
            No quota or AI required. Practice the 12 essential fresher interview questions asked across Indian IT service and product companies.
          </p>
          <ul className="text-xs text-stone-500 space-y-1.5 mb-6">
            <li>• &quot;Tell me about yourself&quot; framing</li>
            <li>• Browser URL internals &amp; TCP</li>
            <li>• Async / event loop fundamentals</li>
            <li>• Conflict resolution &amp; team situations</li>
          </ul>
        </div>

        <button
          onClick={onStartBasics}
          disabled={loading}
          className="w-full px-4 py-2 border border-[#064E3B] text-[#064E3B] hover:bg-[#064E3B] hover:text-white text-xs font-semibold rounded-lg transition-colors"
        >
          Browse 12 Core Questions
        </button>
      </div>
    </div>
  );
};
