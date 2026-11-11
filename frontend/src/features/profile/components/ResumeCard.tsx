"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useUploadResume, useDeleteResume } from "../hooks/useProfile";
import { profileApi } from "../services/profile.api";
import { ResumeInfo } from "../../../types/profile";
import { ApiClientError } from "../../../config/api";
import { Card } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { ROUTES } from "../../../constants/routes";
import { toast } from "sonner";
import { FileText, Upload, Eye, Trash2, RefreshCw, Sparkles, ArrowRight } from "lucide-react";

interface ResumeCardProps {
  resume?: ResumeInfo;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const UPLOAD_ERROR_MAP: Record<number, string> = {
  400: "Invalid file format. Please upload a PDF.",
  413: "File too large. Max 2 MB.",
  429: "Too many upload attempts. Please wait.",
  502: "Upload service unavailable. Try again later.",
};

export const ResumeCard: React.FC<ResumeCardProps> = ({ resume }) => {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const uploadMutation = useUploadResume();
  const deleteMutation = useDeleteResume();

  const [progress, setProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!e.target.files) return;
    // reset input so same file can be re-picked
    e.target.value = "";
    if (!file) return;

    setUploadError(null);

    if (file.type !== "application/pdf") {
      setUploadError("Invalid file format. Please upload a PDF.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setUploadError("File too large. Max 2 MB.");
      return;
    }

    setProgress(0);
    try {
      await uploadMutation.mutateAsync({
        file,
        onProgress: (pct) => setProgress(pct),
      });
      toast.success("Resume uploaded successfully.", {
        action: {
          label: "Check Resume Score",
          onClick: () => router.push(ROUTES.CANDIDATE.RESUME_CHECK),
        },
      });
      queryClient.invalidateQueries({ queryKey: ["profile", "me"] });
    } catch (err) {
      if (err instanceof ApiClientError) {
        setUploadError(UPLOAD_ERROR_MAP[err.statusCode] || err.message || "Upload failed.");
      } else {
        setUploadError("Upload failed. Please try again.");
      }
    } finally {
      setProgress(null);
    }
  };

  const handleView = async () => {
    try {
      const res = await profileApi.getResumeSignedUrl();
      if (res.data?.url) {
        window.open(res.data.url, "_blank", "noreferrer");
      }
    } catch (err) {
      toast.error("Could not retrieve resume URL. Please try again.");
    }
  };

  const handleDelete = async () => {
    setShowDeleteConfirm(false);
    try {
      await deleteMutation.mutateAsync();
      queryClient.invalidateQueries({ queryKey: ["profile", "me"] });
    } catch (err) {
      if (err instanceof ApiClientError) {
        toast.error(err.message || "Failed to delete resume.");
      }
    }
  };

  const hasResume = Boolean(resume?.fileName);

  return (
    <Card className="p-6 bg-cream border-champagne-border space-y-4">
      <div className="flex items-center gap-2 border-b border-champagne-border/60 pb-3">
        <FileText className="w-5 h-5 text-gold-accent" />
        <h2 className="font-heading text-lg font-bold text-emerald-ink">Resume Upload</h2>
        <span className="text-xs px-2 py-0.5 rounded-full bg-champagne text-body-text/70">PDF only · Max 2 MB</span>
      </div>

      {uploadError && (
        <div className="p-3 rounded-xl bg-error-bg border border-error-border text-error text-xs font-medium">
          {uploadError}
        </div>
      )}

      {!hasResume ? (
        <div
          className="flex flex-col items-center justify-center border-2 border-dashed border-champagne-border rounded-2xl py-10 px-6 cursor-pointer hover:bg-champagne/20 transition-all"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="w-8 h-8 text-gold-accent mb-3" />
          <p className="text-sm font-semibold text-emerald-ink">Click to upload your resume</p>
          <p className="text-xs text-body-text/60 mt-1">PDF only · Max 2 MB</p>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-xl bg-champagne/20 border border-champagne-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald/10 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-emerald-ink" />
            </div>
            <div>
              <p className="text-sm font-semibold text-emerald-ink truncate max-w-xs">{resume?.fileName}</p>
              <p className="text-xs text-body-text/60">
                {resume?.size != null ? formatBytes(resume.size) : ""}
                {resume?.uploadedAt ? ` · Uploaded ${formatDate(resume.uploadedAt)}` : ""}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={handleView} className="text-xs gap-1.5">
              <Eye className="w-3.5 h-3.5" /> View
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Replace
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
              className="text-xs text-error-red hover:bg-error-bg gap-1.5"
              isLoading={deleteMutation.isPending}
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </Button>
          </div>
        </div>
      )}

      {/* Inline CTA to Resume Score Checker */}
      {hasResume && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-ui bg-gradient-to-r from-emerald/10 via-champagne/40 to-gold/10 border border-gold/30">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-gold shrink-0" />
            <p className="text-xs text-emerald-dark font-medium leading-relaxed">
              Check how your resume scores against industry standards and target job roles with AI feedback.
            </p>
          </div>
          <Link href={ROUTES.CANDIDATE.RESUME_CHECK} className="shrink-0 w-full sm:w-auto">
            <Button variant="primary" size="sm" className="w-full text-xs gap-1.5 shadow-emerald-sm">
              <span>Check resume score</span>
              <ArrowRight className="w-3 h-3 text-gold-light" />
            </Button>
          </Link>
        </div>
      )}

      {/* Progress bar */}
      {progress !== null && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-body-text/70">
            <span>Uploading…</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-champagne-border/40 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald to-gold-accent transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Delete confirm dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-cream border border-champagne-border rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
            <h3 className="font-heading text-lg font-bold text-emerald-ink mb-2">Delete Resume?</h3>
            <p className="text-sm text-body-text/70 mb-5">
              Your uploaded resume will be permanently deleted. This cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handleDelete} isLoading={deleteMutation.isPending}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

