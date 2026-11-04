"use client";

import React, { InputHTMLAttributes, forwardRef } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className = "",
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      id,
      disabled,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold uppercase tracking-wider text-body/80 select-none"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3.5 text-muted pointer-events-none flex items-center">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            disabled={disabled}
            className={`w-full bg-cream-input text-body placeholder:text-muted/60 border rounded-ui text-sm transition-all duration-150 h-11 px-3.5 ${
              leftIcon ? "pl-10" : ""
            } ${rightIcon ? "pr-10" : ""} ${
              error
                ? "border-error focus:border-error focus:ring-1 focus:ring-error bg-error-bg/30"
                : "border-border focus:border-gold focus:ring-2 focus:ring-gold/30"
            } disabled:opacity-50 disabled:bg-cream/40 focus:outline-none ${className}`}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3.5 text-muted flex items-center">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p className="text-xs text-error font-medium flex items-center gap-1" role="alert">
            <span className="w-1.5 h-1.5 rounded-full bg-error shrink-0" />
            {error}
          </p>
        )}
        {!error && helperText && (
          <p className="text-xs text-muted">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

