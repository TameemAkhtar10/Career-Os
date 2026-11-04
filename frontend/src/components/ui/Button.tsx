"use client";

import React, { ButtonHTMLAttributes, forwardRef } from "react";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "gold" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = "",
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-all duration-150 rounded-ui focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 focus:ring-offset-champagne active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 select-none";

    const variantStyles = {
      primary:
        "bg-gradient-to-br from-emerald to-emerald-dark text-white hover:bg-emerald-hover shadow-emerald-sm hover:shadow-emerald-md",
      secondary:
        "bg-cream text-emerald-dark border border-border hover:bg-white shadow-emerald-sm",
      gold:
        "bg-gradient-to-r from-gold-start to-gold text-white shadow-emerald-sm hover:brightness-105",
      outline:
        "bg-transparent text-emerald-dark border border-border hover:bg-cream/60",
      ghost:
        "bg-transparent text-body hover:bg-cream/60 hover:text-emerald-dark",
      danger:
        "bg-error text-white hover:bg-error/90 shadow-emerald-sm",
    };

    const sizeStyles = {
      sm: "text-xs px-3 py-1.5 gap-1.5 h-8",
      md: "text-sm px-4 py-2 gap-2 h-10",
      lg: "text-base px-6 py-2.5 gap-2.5 h-12",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

