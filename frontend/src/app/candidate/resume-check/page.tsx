import { Metadata } from "next";
import { Suspense } from "react";
import { ResumeCheckPage } from "@/features/resume-check/pages/ResumeCheckPage";
import { BrandLoader } from "@/components/feedback/BrandLoader";

export const metadata: Metadata = {
  title: "Resume Score Checker",
  description: "Check your resume score, verify formatting & layout, and analyze keyword alignment.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <Suspense fallback={<BrandLoader message="Loading resume checker..." />}>
      <ResumeCheckPage />
    </Suspense>
  );
}

