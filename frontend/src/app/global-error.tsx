"use client";

import React from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="bg-[#F8E7C9] text-[#2D3748] min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-[#FFF8EC] border border-[#E8D3AA] rounded-[20px] p-8 text-center shadow-lg">
          <h2 className="text-2xl font-bold text-[#064E3B] mb-3">
            Application Error
          </h2>
          <p className="text-sm text-[#6B7280] mb-6">
            A critical error interrupted the application. Please try reloading.
          </p>
          <button
            onClick={() => reset()}
            className="px-5 py-2.5 bg-[#064E3B] text-white rounded-[12px] font-semibold text-sm hover:bg-[#09634C] transition-colors"
          >
            Reload Application
          </button>
        </div>
      </body>
    </html>
  );
}

