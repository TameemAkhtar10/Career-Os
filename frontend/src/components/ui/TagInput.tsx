"use client";

import React, { useState, KeyboardEvent } from "react";
import { X } from "lucide-react";

export interface TagInputProps {
  label?: string;
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
  error?: string;
  disabled?: boolean;
}

export const TagInput: React.FC<TagInputProps> = ({
  label,
  tags,
  onChange,
  placeholder = "Type and press Enter...",
  maxTags = 20,
  error,
  disabled = false,
}) => {
  const [inputVal, setInputVal] = useState("");

  const addTag = (val: string) => {
    const trimmed = val.trim();
    if (!trimmed) return;
    if (tags.length >= maxTags) return;
    if (!tags.some((t) => t.toLowerCase() === trimmed.toLowerCase())) {
      onChange([...tags, trimmed]);
    }
    setInputVal("");
  };

  const removeTag = (index: number) => {
    onChange(tags.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(inputVal);
    } else if (e.key === "Backspace" && !inputVal && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  };

  return (
    <div className="w-full space-y-1.5 text-left">
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-xs font-semibold uppercase tracking-wider text-body/80 select-none">
            {label}
          </label>
          <span className="text-[11px] text-muted">
            {tags.length}/{maxTags}
          </span>
        </div>
      )}
      <div
        className={`min-h-[44px] p-2 bg-cream-input border rounded-ui flex flex-wrap gap-1.5 items-center transition-all ${
          error
            ? "border-error focus-within:ring-2 focus-within:ring-error/20"
            : "border-border focus-within:border-gold focus-within:ring-2 focus-within:ring-gold/30"
        } ${disabled ? "opacity-50 pointer-events-none" : ""}`}
      >
        {tags.map((tag, idx) => (
          <span
            key={idx}
            className="inline-flex items-center gap-1 bg-cream text-emerald-dark border border-border text-xs px-2.5 py-1 rounded-badge font-medium shadow-emerald-sm animate-fadeIn"
          >
            {tag}
            {!disabled && (
              <button
                type="button"
                onClick={() => removeTag(idx)}
                className="hover:text-error transition-colors p-0.5 rounded-full"
                aria-label={`Remove ${tag}`}
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </span>
        ))}
        {tags.length < maxTags && (
          <input
            type="text"
            value={inputVal}
            disabled={disabled}
            placeholder={tags.length === 0 ? placeholder : ""}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => addTag(inputVal)}
            className="flex-1 min-w-[120px] bg-transparent text-sm text-body placeholder:text-muted/60 focus:outline-none h-7 px-1"
          />
        )}
      </div>
      {error && (
        <p className="text-xs text-error font-medium flex items-center gap-1" role="alert">
          <span className="w-1.5 h-1.5 rounded-full bg-error shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
};

