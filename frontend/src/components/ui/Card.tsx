"use client";

import React, { HTMLAttributes } from "react";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hoverLift?: boolean;
}

export const Card: React.FC<CardProps> = ({
  className = "",
  hoverLift = false,
  children,
  ...props
}) => {
  return (
    <div
      className={`bg-cream border border-border rounded-card p-6 shadow-emerald-sm transition-all duration-200 ${
        hoverLift
          ? "hover:-translate-y-1 hover:shadow-emerald-md hover:border-gold/50 cursor-pointer"
          : ""
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

