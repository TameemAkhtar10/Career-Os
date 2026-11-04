"use client";

import React, { useRef, useEffect } from "react";

export interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  disabled?: boolean;
  error?: string;
}

export const OtpInput: React.FC<OtpInputProps> = ({
  value,
  onChange,
  length = 6,
  disabled = false,
  error,
}) => {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Focus first input on mount
    if (!disabled && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [disabled]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const val = e.target.value.replace(/\D/g, "");
    if (!val) {
      const newValue = value.slice(0, index) + " " + value.slice(index + 1);
      onChange(newValue.trimEnd());
      return;
    }

    const char = val.slice(-1);
    const chars = value.padEnd(length, " ").split("");
    chars[index] = char;
    const nextVal = chars.join("").trimEnd();
    onChange(nextVal);

    if (index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace") {
      if (!value[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (!pasteData) return;

    onChange(pasteData);
    const targetIdx = Math.min(pasteData.length, length - 1);
    inputRefs.current[targetIdx]?.focus();
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-center gap-2 sm:gap-3">
        {Array.from({ length }).map((_, index) => {
          const char = value[index] || "";
          return (
            <input
              key={index}
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              value={char}
              disabled={disabled}
              onChange={(e) => handleChange(e, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              onPaste={handlePaste}
              className={`w-11 h-14 sm:w-12 sm:h-16 text-center text-xl sm:text-2xl font-bold font-fraunces rounded-ui bg-cream-input border transition-all duration-150 ${
                error
                  ? "border-error focus:border-error focus:ring-2 focus:ring-error/20 bg-error-bg/30 text-error"
                  : "border-border focus:border-gold focus:ring-2 focus:ring-gold/30 text-emerald-dark"
              } focus:outline-none disabled:opacity-50`}
            />
          );
        })}
      </div>
      {error && (
        <p className="text-xs text-error text-center font-medium" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

