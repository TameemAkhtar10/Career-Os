import React, { useState, useEffect } from "react";
import {
  InterviewQuestion,
  InterviewFeedback,
  AiAnswerResponse,
  QuotaInfo,
} from "../types/interviewPrep.types";
import {
  Clock,
  Star,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  RotateCcw,
  HelpCircle,
  SkipForward,
  Copy,
  Check,
  MessageSquarePlus,
  Bot,
} from "lucide-react";
import { toast } from "sonner";

interface PracticeModeProps {
  questions: InterviewQuestion[];
  currentIdx: number;
  onSelectIndex: (idx: number) => void;
  onSubmitAnswer: (q: InterviewQuestion, answer: string) => Promise<InterviewFeedback>;
  onRequestAiAnswer: (q: InterviewQuestion) => Promise<AiAnswerResponse>;
  onSkipQuestion: (q: InterviewQuestion) => void;
  onAnswerFollowUp: (parentQ: InterviewQuestion, followUpText: string) => void;
  feedback: InterviewFeedback | null;
  aiAnswer: AiAnswerResponse | null;
  loadingFeedback: boolean;
  loadingAiAnswer: boolean;
  onFinishSession: () => void;
  quota: QuotaInfo | null;
}

export const PracticeMode: React.FC<PracticeModeProps> = ({
  questions,
  currentIdx,
  onSelectIndex,
  onSubmitAnswer,
  onRequestAiAnswer,
  onSkipQuestion,
  onAnswerFollowUp,
  feedback,
  aiAnswer,
  loadingFeedback,
  loadingAiAnswer,
  onFinishSession,
  quota,
}) => {
  const currentQ = questions[currentIdx];
  const [answer, setAnswer] = useState("");
  const [timerSeconds, setTimerSeconds] = useState(120);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const [copiedField, setCopiedField] = useState<"yours" | "ai" | null>(null);

  useEffect(() => {
    setAnswer("");
    setTimerSeconds(120);
    setIsTimerRunning(false);
    setShowHints(false);
    setCopiedField(null);
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

  const wordCount = answer.trim() ? answer.trim().split(/\s+/).length : 0;

  const formatTimer = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const handleEvaluate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim() || answer.trim().length < 5) return;
    setIsTimerRunning(false);
    await onSubmitAnswer(currentQ, answer.trim());
  };

  const handleIdk = async () => {
    setIsTimerRunning(false);
    await onRequestAiAnswer(currentQ);
  };

  const handleSkip = () => {
    setIsTimerRunning(false);
    onSkipQuestion(currentQ);
    if (currentIdx < questions.length - 1) {
      onSelectIndex(currentIdx + 1);
    } else {
      onFinishSession();
    }
  };

  const handleCopy = async (text: string, which: "yours" | "ai") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(which);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopiedField(null), 1500);
    } catch {
      toast.error("Could not copy text");
    }
  };

  const isLastQuestion = currentIdx === questions.length - 1;

  return (
    <div className="space-y-5">
      {/* Progress Bar & Question Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-[#E8D3AA] p-3 rounded-xl shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 sm:pb-0">
          {questions.map((q, idx) => (
            <button
              key={q.id || idx}
              type="button"
              onClick={() => onSelectIndex(idx)}
              className={`w-8 h-8 rounded-lg text-xs font-bold shrink-0 transition-all ${
                currentIdx === idx
                  ? "bg-[#064E3B] text-white shadow-xs"
                  : q.isFollowUp
                  ? "bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
              title={q.isFollowUp ? "Follow-up question" : `Question ${idx + 1}`}
            >
              {q.isFollowUp ? "F" : idx + 1}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 ml-auto">
          <span className="text-xs text-stone-500 font-medium">
            {currentIdx + 1} / {questions.length}
          </span>
          <button
            type="button"
            onClick={onFinishSession}
            className="px-3 py-1.5 rounded-lg bg-[#064E3B]/10 text-[#064E3B] hover:bg-[#064E3B] hover:text-white text-xs font-semibold transition-colors"
          >
            Finish &amp; Generate Report
          </button>
        </div>
      </div>

      {/* Main Question Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Question & Answer Form */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white border border-[#E8D3AA] rounded-2xl p-5 sm:p-6 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#F8E7C9] text-[#064E3B]">
                  {currentQ.category}
                </span>
                {currentQ.relatedTo && (
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#E6F4EA] text-[#064E3B]">
                    {currentQ.relatedTo}
                  </span>
                )}
              </div>
              <span className="text-xs text-stone-500 capitalize">
                {currentQ.difficulty} difficulty
              </span>
            </div>

            <h3 className="text-base sm:text-lg font-bold text-stone-900 leading-snug mb-3 font-serif">
              {currentQ.question}
            </h3>

            {currentQ.whyAsked && (
              <p className="text-xs text-stone-600 mb-4 bg-stone-50 p-2.5 rounded-lg border border-stone-200/60">
                <strong>Why this is asked:</strong> {currentQ.whyAsked}
              </p>
            )}

            {/* 2-Min Timer & Hints Toggle */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-stone-100 pt-3 text-xs">
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
                <span className="font-semibold block mb-1">Hints:</span>
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
                Your Answer
              </label>
              <textarea
                rows={7}
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Write how you would answer out loud: Context -> Action -> Technical details / Outcome..."
                className="w-full text-sm border border-stone-200 rounded-lg p-3 focus:ring-2 focus:ring-[#064E3B] focus:outline-none"
              />
              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-stone-500 mt-2">
                <span>
                  {wordCount} {wordCount === 1 ? "word" : "words"} ({answer.length} chars)
                </span>
                {quota && (
                  <span className="font-mono text-[#064E3B]">
                    AI uses today: {quota.used} / {quota.limit}
                  </span>
                )}
              </div>
            </div>

            {/* Primary Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="submit"
                disabled={loadingFeedback || loadingAiAnswer || answer.trim().length < 5}
                className="flex-1 min-w-[160px] px-4 py-2.5 bg-[#064E3B] hover:bg-[#032E23] text-white text-xs font-semibold rounded-lg shadow-sm disabled:opacity-50 flex items-center justify-center gap-1.5 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{loadingFeedback ? "Evaluating..." : "Submit for feedback"}</span>
              </button>

              <button
                type="button"
                disabled={loadingFeedback || loadingAiAnswer}
                onClick={handleIdk}
                className="px-3.5 py-2.5 bg-[#FFF8EC] border border-[#C8963E] text-[#064E3B] hover:bg-[#F8E7C9] text-xs font-semibold rounded-lg disabled:opacity-50 flex items-center justify-center gap-1.5 transition-colors"
              >
                <HelpCircle className="w-3.5 h-3.5 text-[#C8963E]" />
                <span>{loadingAiAnswer ? "Loading..." : "I don't know - show AI answer"}</span>
              </button>

              <button
                type="button"
                disabled={loadingFeedback || loadingAiAnswer}
                onClick={handleSkip}
                className="px-3.5 py-2.5 border border-stone-200 bg-white text-stone-600 hover:bg-stone-50 text-xs font-semibold rounded-lg flex items-center justify-center gap-1"
              >
                <SkipForward className="w-3.5 h-3.5" />
                <span>Skip</span>
              </button>
            </div>

            {/* Prev / Next navigation */}
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                disabled={currentIdx === 0}
                onClick={() => onSelectIndex(currentIdx - 1)}
                className="px-3 py-1.5 text-xs font-medium text-stone-600 hover:text-stone-900 disabled:opacity-40 flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Previous
              </button>

              {isLastQuestion ? (
                <button
                  type="button"
                  onClick={onFinishSession}
                  className="px-4 py-1.5 text-xs font-semibold text-[#064E3B] hover:underline flex items-center gap-1"
                >
                  Finish &amp; View Report <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onSelectIndex(currentIdx + 1)}
                  className="px-3 py-1.5 text-xs font-medium text-stone-600 hover:text-stone-900 flex items-center gap-1"
                >
                  Next <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Right: Real-time Feedback OR AI Answer Helper */}
        <div className="lg:col-span-6 space-y-4">
          {feedback ? (
            <div className="bg-white border border-[#E8D3AA] rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-xs font-semibold text-emerald-800 flex items-center gap-1.5 mb-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Strengths
                  </h4>
                  <ul className="text-xs text-stone-600 space-y-1 pl-4">
                    {feedback.strengths.map((str, idx) => (
                      <li key={idx} className="list-disc">
                        {str}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-amber-800 flex items-center gap-1.5 mb-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    Improvements
                  </h4>
                  <ul className="text-xs text-stone-600 space-y-1 pl-4">
                    {feedback.improvements.map((imp, idx) => (
                      <li key={idx} className="list-disc">
                        {imp}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {feedback.betterStructure && (
                <div className="bg-[#FFF8EC] border border-[#E8D3AA] rounded-xl p-3.5 text-xs">
                  <span className="font-bold text-[#064E3B] block mb-1">
                    How to structure it:
                  </span>
                  <p className="text-stone-700 leading-relaxed whitespace-pre-line">
                    {feedback.betterStructure}
                  </p>
                </div>
              )}

              {/* Side-by-side: Your answer vs Better answer (AI) */}
              {feedback.betterAnswerUnavailable ? (
                <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-600">
                  Could not create a grounded sample answer; use the structure above.
                </div>
              ) : (
                feedback.betterAnswer && (
                  <div className="space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 text-xs flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-bold text-stone-800">Your answer</span>
                            <button
                              type="button"
                              onClick={() => handleCopy(answer, "yours")}
                              className="text-stone-500 hover:text-stone-800 inline-flex items-center gap-1 text-[11px]"
                            >
                              {copiedField === "yours" ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                              Copy
                            </button>
                          </div>
                          <p className="text-stone-600 leading-relaxed whitespace-pre-line">
                            {answer}
                          </p>
                        </div>
                      </div>

                      <div className="bg-[#E6F4EA]/50 border border-[#064E3B]/20 rounded-xl p-3 text-xs flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-bold text-[#064E3B]">A better answer (AI)</span>
                            <button
                              type="button"
                              onClick={() => handleCopy(feedback.betterAnswer || "", "ai")}
                              className="text-[#064E3B] hover:text-[#032E23] inline-flex items-center gap-1 text-[11px]"
                            >
                              {copiedField === "ai" ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                              Copy
                            </button>
                          </div>
                          <p className="text-stone-700 leading-relaxed whitespace-pre-line">
                            {feedback.betterAnswer}
                          </p>
                        </div>
                      </div>
                    </div>
                    <p className="text-[11px] text-stone-500 italic">
                      Sample answer. Put it into your own words and fill the [brackets] with your real details.
                    </p>
                  </div>
                )
              )}

              {/* Follow-up question next step */}
              {feedback.followUpQuestion && !currentQ.isFollowUp && (
                <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 text-xs space-y-2.5">
                  <div>
                    <span className="font-bold text-amber-900 block mb-1">
                      Interviewer Follow-up:
                    </span>
                    <p className="text-stone-700 italic">&quot;{feedback.followUpQuestion}&quot;</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onAnswerFollowUp(currentQ, feedback.followUpQuestion || "")}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#064E3B] text-white font-semibold hover:bg-[#032E23] transition-colors"
                  >
                    <MessageSquarePlus className="w-3.5 h-3.5" />
                    <span>Answer the follow-up</span>
                  </button>
                </div>
              )}
            </div>
          ) : aiAnswer ? (
            <div className="bg-white border border-[#C8963E] rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-3">
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-[#C8963E]" />
                  <span className="font-serif font-bold text-stone-900 text-sm">
                    AI Sample Answer
                  </span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[11px] font-bold">
                  AI-assisted
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-900">
                Marked as <strong>AI-assisted</strong>: this item will be reported honestly in your final report and excluded from your own strengths.
              </div>

              {aiAnswer.betterAnswerUnavailable ? (
                <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-600">
                  Could not create a grounded sample answer; review the key points below.
                </div>
              ) : (
                <div className="bg-[#FFF8EC] border border-[#E8D3AA] rounded-xl p-4 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#064E3B]">Sample Answer</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(aiAnswer.betterAnswer, "ai")}
                      className="text-[#064E3B] inline-flex items-center gap-1 text-[11px]"
                    >
                      {copiedField === "ai" ? (
                        <Check className="w-3 h-3" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                      Copy
                    </button>
                  </div>
                  <p className="text-stone-700 leading-relaxed whitespace-pre-line">
                    {aiAnswer.betterAnswer}
                  </p>
                  <p className="text-[11px] text-stone-500 italic">
                    Sample answer. Put it into your own words and fill the [brackets] with your real details.
                  </p>
                </div>
              )}

              {aiAnswer.keyPoints && aiAnswer.keyPoints.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-stone-800 mb-1.5">
                    Key points to remember:
                  </h4>
                  <ul className="text-xs text-stone-600 space-y-1 pl-4">
                    {aiAnswer.keyPoints.map((kp, i) => (
                      <li key={i} className="list-disc">
                        {kp}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {aiAnswer.howToDeliver && (
                <div className="text-xs bg-stone-50 p-3 rounded-xl border border-stone-200">
                  <span className="font-semibold text-stone-800 block mb-0.5">
                    How to deliver it:
                  </span>
                  <p className="text-stone-600">{aiAnswer.howToDeliver}</p>
                </div>
              )}

              {aiAnswer.followUpYouMayGet && (
                <div className="text-xs bg-stone-50 p-3 rounded-xl border border-stone-200">
                  <span className="font-semibold text-stone-800 block mb-0.5">
                    Follow-up you may get:
                  </span>
                  <p className="text-stone-600 italic">&quot;{aiAnswer.followUpYouMayGet}&quot;</p>
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
                Submit your answer for instant scoring and a grounded sample answer, or click{" "}
                <strong>I don&apos;t know - show AI answer</strong> if you are stuck.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
