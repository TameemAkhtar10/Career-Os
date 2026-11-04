"use client";

import React, { HTMLAttributes } from "react";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "fresher" | "gold" | "success" | "warning" | "error" | "outline";
  size?: "sm" | "md";
}

export const Badge: React.FC<BadgeProps> = ({
  className = "",
  variant = "default",
  size = "md",
  children,
  ...props
}) => {
  const baseStyles =
    "inline-flex items-center font-medium rounded-badge uppercase tracking-wider select-none shrink-0";

  const sizeStyles = {
    sm: "text-[10px] px-2.5 py-0.5 gap-1",
    md: "text-xs px-3 py-1 gap-1.5",
  };

  const variantStyles = {
    default: "bg-emerald/10 text-emerald-dark border border-emerald/20",
    fresher:
      "bg-gold-light text-gold-hover border border-gold/40 shadow-emerald-sm font-semibold",
    gold: "bg-gold text-white shadow-emerald-sm",
    success: "bg-success-bg text-success border border-success-border font-semibold",
    warning: "bg-gold-light text-gold border border-gold/30 font-semibold",
    error: "bg-error-bg text-error border border-error-border font-semibold",
    outline: "bg-cream text-body border border-border",
  };

  return (
    <span
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};

