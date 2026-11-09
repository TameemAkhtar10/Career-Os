"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Ensures page position resets to top on Next.js client-side route transitions.
 */
export const ScrollToTop: React.FC = () => {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }
  }, [pathname]);

  return null;
};

