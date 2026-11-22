import { Metadata } from "next";
import { Suspense } from "react";
import { ResumeBuilderPage } from "@/features/resume-builder/pages/ResumeBuilderPage";
import { BrandLoader } from "@/components/feedback/BrandLoader";

export const metadata: Metadata = {
  title: "Resume Builder | CareerOS",
  description: "Build a clean, single-column resume that passes automated screening and gets interviews.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <Suspense fallback={<BrandLoader message="Loading resume builder..." />}>
      <ResumeBuilderPage />
    </Suspense>
  );
}
