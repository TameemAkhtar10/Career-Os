"use client";

import React from "react";

export interface TabItem<T extends string = string> {
  id: T;
  label: string;
  count?: number;
}

export interface TabsProps<T extends string = string> {
  tabs: TabItem<T>[];
  activeTab: T;
  onChange: (id: T) => void;
  className?: string;
}

export function Tabs<T extends string = string>({
  tabs,
  activeTab,
  onChange,
  className = "",
}: TabsProps<T>) {
  return (
    <div className={`flex items-center gap-1.5 border-b border-border pb-1 overflow-x-auto scrollbar-none ${className}`}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`px-4 py-2 text-sm font-medium rounded-ui transition-all whitespace-nowrap flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-gold ${
              isActive
                ? "bg-cream text-emerald-dark border border-border shadow-emerald-sm font-semibold"
                : "text-muted hover:text-body hover:bg-cream/40"
            }`}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  isActive
                    ? "bg-emerald text-white"
                    : "bg-border/60 text-body"
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

