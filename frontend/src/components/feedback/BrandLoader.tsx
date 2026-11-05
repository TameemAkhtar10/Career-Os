"use client";

import React from "react";
import { LogoMark } from "../layout/Logo";

interface BrandLoaderProps {
  message?: string;
  fullScreen?: boolean;
}

export const BrandLoader: React.FC<BrandLoaderProps> = ({
  message = "Loading Career OS...",
  fullScreen = true,
}) => {
  const content = (
    <div className="flex flex-col items-center justify-center gap-4 text-center">
      <div className="motion-safe:animate-[pulse_1.8s_ease-in-out_infinite]">
        <LogoMark size="lg" isLoader={false} className="w-14 h-14" />
      </div>
      <div className="space-y-1">
        <h2 className="font-display text-2xl font-bold tracking-[-0.01em] text-[#064E3B]">
          Career OS
        </h2>
        <p className="text-xs text-muted tracking-wide">{message}</p>
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 bg-[#F8E7C9]/95 backdrop-blur-md flex items-center justify-center">
        {content}
      </div>
    );
  }

  return <div className="py-12 flex items-center justify-center">{content}</div>;
};
