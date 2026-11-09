import React, { Suspense } from "react";
import { Metadata } from "next";
import { UnsubscribePage } from "@/features/notifications/pages/UnsubscribePage";
import { Loader2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Unsubscribe | Career OS",
  robots: { index: false, follow: false },
};

function UnsubscribeFallback() {
  return (
    <div className="min-h-screen bg-champagne/40 flex items-center justify-center p-4">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 text-gold animate-spin" />
        <p className="text-sm text-body/70">Loading unsubscribe request...</p>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<UnsubscribeFallback />}>
      <UnsubscribePage />
    </Suspense>
  );
}

