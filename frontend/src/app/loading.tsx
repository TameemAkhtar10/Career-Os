import React from "react";
import { Skeleton } from "../components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8 animate-fadeIn">
      <div className="space-y-3">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Skeleton className="h-48 w-full rounded-card" />
        <Skeleton className="h-48 w-full rounded-card" />
        <Skeleton className="h-48 w-full rounded-card" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-32 w-full rounded-card" />
        <Skeleton className="h-32 w-full rounded-card" />
      </div>
    </div>
  );
}

