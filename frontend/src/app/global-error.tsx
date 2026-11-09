"use client";

import React, { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Career OS Critical Global Error]:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-[#F8E7C9] text-[#2D3748] min-h-screen flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full bg-[#FFF8EC] border border-[#E8D3AA] rounded-[20px] p-8 text-center shadow-2xl space-y-5">
          {/* Brand Mark */}
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-[8px] bg-[#064E3B] text-[#FFF8EC] font-serif font-bold text-lg flex items-center justify-center">
              C
            </div>
            <span className="font-serif font-bold text-xl text-[#064E3B]">Career OS</span>
          </div>

          <div className="w-14 h-14 rounded-full bg-[#FDEDEB] border border-[#FECACA] flex items-center justify-center text-[#B4443C] mx-auto text-xl font-bold">
            !
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-[#064E3B] font-serif">
              Critical System Error
            </h1>
            <p className="text-sm text-[#6B7280] leading-relaxed">
              A critical issue interrupted the root application. You can reload the page to restore your session.
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={() => reset()}
              className="w-full sm:w-auto px-6 py-2.5 bg-[#064E3B] hover:bg-[#09634C] text-[#FFF8EC] rounded-[12px] font-semibold text-sm transition-colors shadow-md"
            >
              Reload Application
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
