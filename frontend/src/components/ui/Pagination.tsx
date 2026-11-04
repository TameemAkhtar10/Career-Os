"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  className = "",
}) => {
  if (totalPages <= 1) return null;

  return (
    <div className={`flex items-center justify-center gap-2 pt-6 select-none ${className}`}>
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className="px-3 py-1.5 rounded-ui border border-border bg-cream text-body text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-gold"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
        Previous
      </button>

      <div className="flex items-center gap-1">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
          const isActive = page === currentPage;
          return (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`w-8 h-8 rounded-ui text-xs font-medium flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-gold ${
                isActive
                  ? "bg-emerald text-white shadow-emerald-sm font-bold"
                  : "bg-cream text-body border border-border hover:bg-white"
              }`}
            >
              {page}
            </button>
          );
        })}
      </div>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="px-3 py-1.5 rounded-ui border border-border bg-cream text-body text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-gold"
      >
        Next
        <ChevronRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

