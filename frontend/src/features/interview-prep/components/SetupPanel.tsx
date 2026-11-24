import React, { useState } from "react";
import { Sparkles, BookOpen, Target, ShieldCheck } from "lucide-react";

interface SetupPanelProps {
  onStartCustom: (params: { role: string; focus: string; level: string }) => void;
  onStartBasics: () => void;
  loading: boolean;
  initialRole?: string;
}

export const SetupPanel: React.FC<SetupPanelProps> = ({
  onStartCustom,
  onStartBasics,
  loading,
  initialRole = "",
}) => {
  const [role, setRole] = useState(initialRole || "Junior Frontend Developer");
  const [focus, setFocus] = useState("mixed");
  const [level, setLevel] = useState("fresher");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!role.trim()) return;
    onStartCustom({ role: role.trim(), focus, level });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* AI Tailored Interview */}
      <div className="md:col-span-2 bg-white border border-[#E8D3AA] rounded-2xl p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-2 rounded-lg bg-[#E6F4EA] text-[#064E3B]">
            <Sparkles className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-bold text-stone-900 font-serif">
            Role-Specific Mock Interview (AI Grounded)
          </h2>
        </div>
        <p className="text-xs text-stone-600 mb-6">
          Generates 5 realistic technical, system, or situational questions based on your profile and target job. Zero generic fluff.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
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
                <option value="mixed">Mixed (Technical + Situational)</option>
                <option value="technical">Core Technical & Problem Solving</option>
                <option value="hr">HR & Cultural Alignment</option>
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

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-6 py-2.5 bg-[#064E3B] hover:bg-[#032E23] text-white text-sm font-semibold rounded-lg shadow-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Target className="w-4 h-4" />
              <span>{loading ? "Generating questions..." : "Start Practice Session"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Static Basics Card */}
      <div className="bg-[#FFF8EC] border border-[#E8D3AA] rounded-2xl p-6 flex flex-col justify-between shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-2 text-[#064E3B]">
            <BookOpen className="w-5 h-5" />
            <h3 className="text-base font-bold font-serif">Foundational 12 Questions</h3>
          </div>
          <p className="text-xs text-stone-600 leading-relaxed mb-4">
            No quota or AI required. Practice the 12 essential fresher interview questions asked across Indian IT service and product companies.
          </p>
          <ul className="text-xs text-stone-500 space-y-1.5 mb-6">
            <li>• "Tell me about yourself" framing</li>
            <li>• Browser URL internals & TCP</li>
            <li>• Async / event loop fundamentals</li>
            <li>• Conflict resolution & team situations</li>
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
