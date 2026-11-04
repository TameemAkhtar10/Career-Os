"use client";

import React, { HTMLAttributes } from "react";

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = "", ...props }) => {
  return (
    <div
      className={`animate-pulse bg-gradient-to-r from-border/30 via-cream to-border/30 bg-[length:200%_100%] rounded-ui ${className}`}
      {...props}
    />
  );
};

