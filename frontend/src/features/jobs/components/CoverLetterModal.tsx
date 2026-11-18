"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import { apiClient, ApiClientError } from "../../../config/api";
import { ApiResponse } from "../../../types/api";
import { ConsentDialog } from "../../resume-check/components/ConsentDialog";
import { Button } from "../../../components/ui/Button";
import { toast } from "sonner";
import {
  Sparkles,
  Copy,
  Download,
  RotateCw,
  X,
  FileText,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  ShieldAlert,
} from "lucide-react";

interface CoverLetterData {
  aiAvailable: boolean;
  subject?: string;
  body?: string;
  usedSkills?: string[];
  tone?: string;
  message?: string;
}

interface CoverLetterModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string;
  jobTitle: string;
  companyName: string;
}

type ToneType = "professional" | "friendly" | "concise";

export const CoverLetterModal: React.FC<CoverLetterModalProps> = ({
  isOpen,
  onClose,
  jobId,
  jobTitle,
  companyName,
}) => {
  const [tone, setTone] = useState<ToneType>("professional");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [usedSkills, setUsedSkills] = useState<string[]>([]);
  const [isConsentOpen, setIsConsentOpen] = useState(false);
  const [errorState, setErrorState] = useState<{
    type: "no_resume" | "rate_limit" | "ai_unavailable" | "verification_failed" | "generic";
    message: string;
  } | null>(null);

  // TanStack Query Mutation
  const mutation = useMutation({
    mutationFn: async ({
      selectedTone,
      consent,
    }: {
      selectedTone: ToneType;
      consent?: boolean;
    }) => {
      const res = await apiClient<CoverLetterData>("/api/cover-letter/generate", {
        method: "POST",
        body: JSON.stringify({ jobId, tone: selectedTone, consent }),
      });
      return res.data;
    },
    onSuccess: (data) => {
      if (data && data.aiAvailable && data.body) {
        setSubject(data.subject || `Application for ${jobTitle} at ${companyName}`);
        setBody(data.body);
        setUsedSkills(data.usedSkills || []);
        setErrorState(null);
        toast.success("Cover letter generated from your resume!");
      } else {
        setErrorState({
          type: "verification_failed",
          message:
            data?.message ||
            "The generated letter did not meet factual verification criteria. Please try again or refine your skills.",
        });
      }
    },
    onError: (err: any) => {
      const status = err?.statusCode || err?.response?.status;
      const msg = err?.message || err?.response?.data?.message || "";

      if (status === 400 && msg.includes("AI consent is required")) {
        setIsConsentOpen(true);
        return;
      }

      if (status === 400 && msg.includes("upload your resume")) {
        setErrorState({
          type: "no_resume",
          message: "Please upload your resume in PDF format before generating a cover letter.",
        });
        return;
      }

      if (status === 429) {
        setErrorState({
          type: "rate_limit",
          message:
            msg ||
            "You have reached your daily cover letter limit. Please try again tomorrow.",
        });
        return;
      }

      if (status === 503) {
        setErrorState({
          type: "ai_unavailable",
          message: "AI is unavailable right now, try again later.",
        });
        return;
      }

      setErrorState({
        type: "generic",
        message: msg || "Failed to generate cover letter. Please try again.",
      });
    },
  });

  if (!isOpen) return null;

  const handleGenerate = (grantedConsent = false) => {
    setErrorState(null);
    mutation.mutate({
      selectedTone: tone,
      consent: grantedConsent ? true : undefined,
    });
  };

  const handleConsentConfirm = () => {
    setIsConsentOpen(false);
    handleGenerate(true);
  };

  const handleCopy = async () => {
    try {
      const fullText = subject ? `Subject: ${subject}\n\n${body}` : body;
      await navigator.clipboard.writeText(fullText);
      toast.success("Cover letter copied to clipboard!");
    } catch {
      toast.error("Failed to copy text to clipboard.");
    }
  };

  const handleDownload = () => {
    try {
      const fullText = subject ? `Subject: ${subject}\n\n${body}` : body;
      const blob = new Blob([fullText], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const safeCompany = companyName.replace(/[^a-zA-Z0-9_-]/g, "_");
      link.download = `Cover_Letter_${safeCompany}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Cover letter downloaded as .txt!");
    } catch {
      toast.error("Failed to download text file.");
    }
  };

  const wordCount = body.trim() ? body.trim().split(/\s+/).length : 0;
  const hasResult = Boolean(body);

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-ink/60 backdrop-blur-sm animate-fadeIn">
        <div className="bg-cream border border-champagne-border rounded-2xl p-6 sm:p-8 max-w-2xl w-full shadow-soft-emerald relative max-h-[90vh] flex flex-col space-y-4 animate-slideUp">
          {/* Header */}
          <div className="flex items-start justify-between pb-3 border-b border-champagne-border/80">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald/10 text-emerald text-xs font-semibold mb-1">
                <Sparkles className="w-3.5 h-3.5 text-gold-accent" />
                <span>AI Cover Letter</span>
              </div>
              <h2 className="font-heading text-xl sm:text-2xl font-bold text-emerald-ink">
                Tailored Cover Letter
              </h2>
              <p className="text-xs text-body-text/70 mt-0.5">
                Applying for <strong className="text-emerald-ink">{jobTitle}</strong> at{" "}
                <strong className="text-emerald-ink">{companyName}</strong>
              </p>
            </div>

            <button
              onClick={onClose}
              className="p-1 rounded-lg text-body-text/60 hover:text-emerald-ink hover:bg-champagne/40 transition-colors"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="overflow-y-auto space-y-4 flex-1 pr-1">
            {/* Tone Selector & Generator Controls */}
            {!hasResult && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-emerald-ink mb-1.5">
                    Select Tone
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(
                      [
                        { id: "professional", label: "Professional", desc: "Structured & formal" },
                        { id: "friendly", label: "Friendly", desc: "Warm & approachable" },
                        { id: "concise", label: "Concise", desc: "Punchy & direct" },
                      ] as const
                    ).map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setTone(t.id)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          tone === t.id
                            ? "border-emerald bg-emerald/10 text-emerald-ink shadow-sm ring-1 ring-emerald"
                            : "border-champagne-border bg-champagne/20 text-body-text/80 hover:bg-champagne/40"
                        }`}
                      >
                        <div className="text-xs font-bold capitalize">{t.label}</div>
                        <div className="text-[10px] text-body-text/60 mt-0.5">{t.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-champagne/30 border border-champagne-border text-xs text-body-text/80 space-y-1">
                  <div className="font-semibold text-emerald-ink flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald" />
                    Strict Privacy &amp; Grounding Policy
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    Your contact info is automatically redacted before transmission. The letter uses
                    only verified facts from your resume and is never stored on our servers.
                  </p>
                </div>
              </div>
            )}

            {/* Error States */}
            {errorState && (
              <div className="p-4 rounded-xl border border-error-red/20 bg-error-bg/60 text-xs text-error-red space-y-2 animate-fadeIn">
                <div className="flex items-start gap-2 font-semibold">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorState.message}</span>
                </div>
                {errorState.type === "no_resume" && (
                  <div className="pt-1">
                    <Link href="/candidate/profile">
                      <Button variant="outline" size="sm" className="text-xs gap-1.5">
                        <FileText className="w-3.5 h-3.5" />
                        Go to Profile &amp; Upload Resume
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Result Area */}
            {hasResult && (
              <div className="space-y-3.5 animate-fadeIn">
                {/* Note */}
                <div className="p-3 rounded-xl bg-gold-accent/10 border border-gold-accent/30 text-xs text-emerald-ink leading-relaxed flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-gold-accent shrink-0 mt-0.5" />
                  <div>
                    <strong>Draft generated from your resume.</strong> Check every sentence and fill
                    the <span className="underline font-semibold">[brackets]</span> before sending.
                  </div>
                </div>

                {/* Subject Line */}
                <div>
                  <label className="block text-[11px] font-semibold text-emerald-ink mb-1">
                    Subject Line
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-champagne/20 border border-champagne-border text-body-text focus:outline-none focus:ring-2 focus:ring-gold-accent"
                  />
                </div>

                {/* Body Textarea */}
                <div>
                  <div className="flex items-center justify-between mb-1 text-[11px]">
                    <label className="font-semibold text-emerald-ink">Cover Letter Body</label>
                    <span className="text-body-text/60 font-medium">{wordCount} words</span>
                  </div>
                  <textarea
                    rows={8}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs sm:text-sm rounded-xl bg-champagne/20 border border-champagne-border text-body-text focus:outline-none focus:ring-2 focus:ring-gold-accent resize-y leading-relaxed font-sans"
                  />
                </div>

                {/* Used Skills */}
                {usedSkills.length > 0 && (
                  <div>
                    <span className="text-[11px] font-semibold text-emerald-ink block mb-1">
                      Skills highlighted from your resume:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {usedSkills.map((s, idx) => (
                        <span
                          key={idx}
                          className="text-[11px] px-2 py-0.5 rounded-md font-medium bg-emerald/10 text-emerald-dark border border-emerald/20"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Controls */}
          <div className="pt-3 border-t border-champagne-border/80 flex flex-wrap items-center justify-between gap-3">
            {!hasResult ? (
              <div className="flex items-center justify-end w-full gap-2">
                <Button variant="ghost" size="sm" onClick={onClose} disabled={mutation.isPending}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleGenerate(false)}
                  isLoading={mutation.isPending}
                  className="gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Generate Cover Letter
                </Button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleGenerate(false)}
                    isLoading={mutation.isPending}
                    className="gap-1.5 text-xs"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    Regenerate
                  </Button>
                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value as ToneType)}
                    className="text-xs px-2 py-1.5 rounded-lg bg-cream border border-champagne-border text-body-text focus:outline-none focus:ring-2 focus:ring-gold-accent"
                  >
                    <option value="professional">Professional</option>
                    <option value="friendly">Friendly</option>
                    <option value="concise">Concise</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleCopy}
                    className="gap-1.5 text-xs"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Copy
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleDownload}
                    className="gap-1.5 text-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download .txt
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* AI Consent Dialog Reuse */}
      <ConsentDialog
        isOpen={isConsentOpen}
        onConfirm={handleConsentConfirm}
        onCancel={() => setIsConsentOpen(false)}
        isLoading={mutation.isPending}
      />
    </>
  );
};
