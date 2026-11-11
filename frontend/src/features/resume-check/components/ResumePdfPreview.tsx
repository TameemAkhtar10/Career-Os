import React, { useState } from "react";
import { Card } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { FileText, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";

interface ResumePdfPreviewProps {
  fileName?: string;
}

export const ResumePdfPreview: React.FC<ResumePdfPreviewProps> = ({
  fileName = "resume.pdf",
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const pdfUrl = "/api/profile/candidate/resume/file#toolbar=0&navpanes=0";

  return (
    <Card className="p-5 sm:p-6 bg-cream border-border shadow-emerald-sm space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          <FileText className="w-5 h-5 text-gold shrink-0" />
          <div>
            <h3 className="font-display text-base sm:text-lg font-bold text-emerald-dark">
              Resume Document Preview
            </h3>
            <p className="text-xs text-muted truncate max-w-xs sm:max-w-md">
              {fileName} · Scanned from MongoDB storage
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/api/profile/candidate/resume/file"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" size="sm" className="text-xs gap-1.5">
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open in New Tab</span>
            </Button>
          </a>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs gap-1"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-3.5 h-3.5" />
                <span>Collapse</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5" />
                <span>Expand</span>
              </>
            )}
          </Button>
        </div>
      </div>

      <div
        className={`w-full rounded-ui overflow-hidden border border-border bg-white transition-all duration-300 ${
          isExpanded ? "h-[750px]" : "h-[360px]"
        }`}
      >
        <iframe
          src={pdfUrl}
          title="Resume PDF Preview"
          className="w-full h-full border-none"
          loading="lazy"
        />
      </div>
    </Card>
  );
};

