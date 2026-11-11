import React from "react";
import { Button } from "../../../components/ui/Button";
import { ShieldCheck, Lock, EyeOff, X } from "lucide-react";

interface ConsentDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const ConsentDialog: React.FC<ConsentDialogProps> = ({
  isOpen,
  onConfirm,
  onCancel,
  isLoading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-dark/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-cream border border-border rounded-card p-6 sm:p-8 max-w-lg w-full shadow-emerald-float relative space-y-5 animate-slideUp">
        <button
          onClick={onCancel}
          disabled={isLoading}
          className="absolute top-4 right-4 p-1 rounded-ui text-muted hover:text-body focus:outline-none"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald/10 text-emerald text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-gold" />
            <span>AI Privacy &amp; Data Transparency</span>
          </div>
          <h3 className="font-display text-2xl font-bold text-emerald-dark">
            AI Resume Analysis Consent
          </h3>
          <p className="text-xs text-body/80 leading-relaxed">
            Before proceeding, please review how Career OS processes your resume data for AI-powered feedback:
          </p>
        </div>

        <div className="space-y-3 text-xs text-body/80">
          <div className="p-3.5 rounded-ui bg-champagne/40 border border-border flex items-start gap-3">
            <EyeOff className="w-4 h-4 text-emerald shrink-0 mt-0.5" />
            <div>
              <strong className="text-emerald-dark block font-semibold mb-0.5">
                Automated PII Redaction
              </strong>
              Your name, email address, phone number, physical address, and all personal links (LinkedIn, GitHub) are automatically stripped before text is processed by our AI provider.
            </div>
          </div>

          <div className="p-3.5 rounded-ui bg-champagne/40 border border-border flex items-start gap-3">
            <Lock className="w-4 h-4 text-emerald shrink-0 mt-0.5" />
            <div>
              <strong className="text-emerald-dark block font-semibold mb-0.5">
                Zero Resume Text Retention
              </strong>
              We never store your raw resume text in the analysis database. Only high-level scores, keyword match lists, and generated suggestions are saved to your personal account.
            </div>
          </div>

          <div className="p-3.5 rounded-ui bg-champagne/40 border border-border flex items-start gap-3">
            <ShieldCheck className="w-4 h-4 text-emerald shrink-0 mt-0.5" />
            <div>
              <strong className="text-emerald-dark block font-semibold mb-0.5">
                Withdraw Consent Anytime
              </strong>
              You may withdraw your consent at any time directly from the Resume Check history drawer or delete all analysis records instantly.
            </div>
          </div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-3">
          <Button
            variant="ghost"
            size="md"
            onClick={onCancel}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={onConfirm}
            isLoading={isLoading}
            className="w-full sm:w-auto gap-2"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Agree &amp; Analyze</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

