import React, { useState, useEffect } from "react";
import {
  InterviewQuestion,
  InterviewFeedback,
} from "../types/interviewPrep.types";
import {
  Clock,
  Send,
  Star,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  RotateCcw,
} from "lucide-react";

interface PracticeModeProps {
  questions: InterviewQuestion[];
  currentIdx: number;
  onSelectIndex: (idx: number) => void;
  onSubmitAnswer: (q: InterviewQuestion, answer: string) => Promise<InterviewFeedback>;
  feedback: InterviewFeedback | null;
  loadingFeedback: boolean;
  onFinishSession: () => void;
}

export const PracticeMode: React.FC<PracticeModeProps> = ({
  questions,
  currentIdx,
  onSelectIndex,
  onSubmitAnswer,
  feedback,
  loadingFeedback,
  onFinishSession,
}) => {
  const currentQ = questions[currentIdx];
  const [answer, setAnswer] = useState("");
  const [timerSeconds, setTimerSeconds] = useState(120); // 2-min timer
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [showHints, setShowHints] = useState(false);

  useEffect(() => {
    setAnswer("");
    setTimerSeconds(120);
    setIsTimerRunning(false);
    setShowHints(false);
  }, [currentIdx]);

  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    } else if (timerSeconds === 0) {
      setIsTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds]);

  if (!currentQ) return null;

  const formatTimer = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const handleEvaluate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim() || answer.trim().length < 10) return;
    setIsTimerRunning(false);
    await onSubmitAnswer(currentQ, answer.trim());
  };

  return (
    <div className="space-y-6">
      {/* Progress Bar & Question Tabs */}
      <div className="flex items-center justify-between gap-3 bg-white border border-[#E8D3AA] p-3 rounded-xl shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {questions.map((q, idx) => (
            <button
              key={q.id || idx}
              onClick={() => onSelectIndex(idx)}
              className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                currentIdx === idx
                  ? "bg-[#064E3B] text-white shadow-xs"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              {idx + 1}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-stone-500 font-medium">
            Question {currentIdx + 1} of {questions.length}
          </span>
          <button
            onClick={onFinishSession}
            className="text-xs font-semibold text-[#064E3B] hover:underline"
          >
            Finish &amp; Save
          </button>
        </div>
      </div>

      {/* Main Question Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left / Center: Question & Answer Form */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white border border-[#E8D3AA] rounded-2xl p-6 shadow-xs">
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#F8E7C9] text-[#064E3B]">
                {currentQ.category}
              </span>
              <span className="text-xs text-stone-400 capitalize">
                {currentQ.difficulty} difficulty
              </span>
            </div>

            <h3 className="text-lg font-bold text-stone-900 leading-snug mb-3 font-serif">
              {currentQ.question}
            </h3>

            {currentQ.whyAsked && (
              <p className="text-xs text-stone-500 mb-4 bg-stone-50 p-2.5 rounded-lg border border-stone-200/60">
                <strong>Why interviewers ask this:</strong> {currentQ.whyAsked}
              </p>
            )}

            {/* 2-Min Timer & Hints Toggle */}
            <div className="flex items-center justify-between border-t border-stone-100 pt-3 text-xs">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsTimerRunning(!isTimerRunning)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg font-mono font-medium transition-colors ${
                    isTimerRunning
                      ? "bg-amber-100 text-amber-900 animate-pulse"
                      : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>{formatTimer(timerSeconds)}</span>
                  <span>{isTimerRunning ? "Pause" : "Start"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTimerSeconds(120);
                    setIsTimerRunning(false);
                  }}
                  className="p-1 text-stone-400 hover:text-stone-700"
                  title="Reset timer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>

              {currentQ.hints && currentQ.hints.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowHints(!showHints)}
                  className="text-[#064E3B] hover:text-[#032E23] font-medium flex items-center gap-1"
                >
                  <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                  <span>{showHints ? "Hide hints" : "Show hints"}</span>
                </button>
              )}
            </div>

            {showHints && currentQ.hints && (
              <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs space-y-1 text-amber-900">
                <span className="font-semibold block mb-1">Key points to include:</span>
                {currentQ.hints.map((h, i) => (
                  <div key={i}>• {h}</div>
                ))}
              </div>
            )}
          </div>

          {/* Answer Form */}
          <form onSubmit={handleEvaluate} className="space-y-3">
            <div className="bg-white border border-[#E8D3AA] rounded-2xl p-4 shadow-xs">
              <label className="block text-xs font-semibold text-stone-700 mb-2">
                Your Answer (or notes of what you'd say)
              </label>
              <textarea
                rows={7}
                required
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Structure your thoughts: Context -> Action taken -> Technical trade-offs -> Outcome..."
                className="w-full text-sm border border-stone-200 rounded-lg p-3 focus:ring-2 focus:ring-[#064E3B] focus:outline-none"
              />
              <div className="flex items-center justify-between text-[11px] text-stone-400 mt-2">
                <span>{answer.length} characters</span>
                <span>Recommended: 150–500 characters for concise answers</span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                disabled={currentIdx === 0}
                onClick={() => onSelectIndex(currentIdx - 1)}
                className="px-4 py-2 text-xs font-medium text-stone-600 hover:text-stone-900 disabled:opacity-40 flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Previous
              </button>

              <button
                type="submit"
                disabled={loadingFeedback || answer.trim().length < 10}
                className="px-5 py-2.5 bg-[#064E3B] hover:bg-[#032E23] text-white text-xs font-semibold rounded-lg shadow-sm disabled:opacity-50 flex items-center gap-1.5 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{loadingFeedback ? "Analyzing response..." : "Get Feedback"}</span>
              </button>

              <button
                type="button"
                disabled={currentIdx === questions.length - 1}
                onClick={() => onSelectIndex(currentIdx + 1)}
                className="px-4 py-2 text-xs font-medium text-stone-600 hover:text-stone-900 disabled:opacity-40 flex items-center gap-1"
              >
                Next <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        </div>

        {/* Right: Real-time Feedback Card */}
        <div className="lg:col-span-5 space-y-4">
          {feedback ? (
            <div className="bg-white border border-[#E8D3AA] rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <span className="font-serif font-bold text-stone-900 text-sm">
                  Answer Evaluation
                </span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${
                        star <= feedback.score
                          ? "text-amber-400 fill-amber-400"
                          : "text-stone-200"
                      }`}
                    />
                  ))}
                  <span className="text-xs font-bold text-stone-700 ml-1">
                    {feedback.score}/5
                  </span>
                </div>
              </div>

              {/* Strengths */}
              <div>
                <h4 className="text-xs font-semibold text-emerald-800 flex items-center gap-1.5 mb-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  What went well:
                </h4>
                <ul className="text-xs text-stone-600 space-y-1 pl-4">
                  {feedback.strengths.map((str, idx) => (
                    <li key={idx} className="list-disc">
                      {str}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Improvements */}
              <div>
                <h4 className="text-xs font-semibold text-amber-800 flex items-center gap-1.5 mb-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  Areas to tighten:
                </h4>
                <ul className="text-xs text-stone-600 space-y-1 pl-4">
                  {feedback.improvements.map((imp, idx) => (
                    <li key={idx} className="list-disc">
                      {imp}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Better Structure Blueprint */}
              {feedback.betterStructure && (
                <div className="bg-[#FFF8EC] border border-[#E8D3AA] rounded-xl p-3.5 text-xs">
                  <span className="font-bold text-[#064E3B] block mb-1">
                    Exemplar Structure (STAR Blueprint):
                  </span>
                  <p className="text-stone-700 leading-relaxed whitespace-pre-line">
                    {feedback.betterStructure}
                  </p>
                </div>
              )}

              {/* Follow-up question */}
              {feedback.followUpQuestion && (
                <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 text-xs">
                  <span className="font-semibold text-stone-700 block mb-1">
                    Natural Next Follow-up Question:
                  </span>
                  <p className="text-stone-600 italic">
                    "{feedback.followUpQuestion}"
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-[#FFF8EC]/60 border border-dashed border-[#E8D3AA] rounded-2xl p-8 text-center text-stone-400">
              <Sparkles className="w-8 h-8 text-[#C8963E] mx-auto mb-2 opacity-60" />
              <h4 className="text-xs font-semibold text-stone-600 mb-1">
                Awaiting your response
              </h4>
              <p className="text-[11px] text-stone-500 leading-relaxed">
                Type your answer and click <strong>Get Feedback</strong> to receive instant coaching on score, structure, and technical accuracy.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
