"use client";

import React, { useRef, useState } from "react";
import { useUploadLogo } from "../hooks/useProfile";
import { ApiClientError } from "../../../config/api";
import { Button } from "../../../components/ui/Button";
import { toast } from "sonner";
import { Upload, Building2 } from "lucide-react";

interface LogoUploaderProps {
  currentLogoUrl?: string;
  onLogoChange?: (url: string) => void;
}

const UPLOAD_ERROR_MAP: Record<number, string> = {
  400: "Invalid image. Please use PNG, JPG, or WEBP.",
  413: "Image too large. Max 1 MB.",
  429: "Too many upload attempts.",
  502: "Upload service unavailable.",
};

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];

export const LogoUploader: React.FC<LogoUploaderProps> = ({ currentLogoUrl, onLogoChange }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadMutation = useUploadLogo();
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentLogoUrl || null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setUploadError(null);

    if (!ALLOWED_TYPES.includes(file.type)) {
      setUploadError("Invalid image. Please use PNG, JPG, or WEBP.");
      return;
    }
    if (file.size > 1 * 1024 * 1024) {
      setUploadError("Image too large. Max 1 MB.");
      return;
    }

    // Show local preview immediately
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);

    try {
      const res = await uploadMutation.mutateAsync(file);
      if (res.data?.companyLogoUrl) {
        setPreviewUrl(res.data.companyLogoUrl);
        onLogoChange?.(res.data.companyLogoUrl);
      }
    } catch (err) {
      setPreviewUrl(currentLogoUrl || null);
      if (err instanceof ApiClientError) {
        setUploadError(UPLOAD_ERROR_MAP[err.statusCode] || err.message || "Upload failed.");
      } else {
        setUploadError("Upload failed. Please try again.");
      }
    }
  };

  return (
    <div className="space-y-3">
      <label className="block text-xs font-semibold text-emerald-ink mb-1">Company Logo</label>

      {uploadError && (
        <div className="p-3 rounded-xl bg-error-bg border border-error-border text-error text-xs font-medium">
          {uploadError}
        </div>
      )}

      <div className="flex items-center gap-4">
        {/* Preview */}
        <div className="w-16 h-16 rounded-xl border border-champagne-border bg-champagne/20 flex items-center justify-center overflow-hidden shrink-0">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Company logo"
              className="w-full h-full object-contain"
              onError={() => setPreviewUrl(null)}
            />
          ) : (
            <Building2 className="w-7 h-7 text-body-text/40" />
          )}
        </div>

        <div className="space-y-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            isLoading={uploadMutation.isPending}
            className="text-xs gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" />
            {previewUrl ? "Change Logo" : "Upload Logo"}
          </Button>
          <p className="text-[11px] text-body-text/60">PNG, JPG, or WEBP · Max 1 MB</p>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
};

