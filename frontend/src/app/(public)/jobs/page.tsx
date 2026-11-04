import { Metadata } from "next";
import { Suspense } from "react";
import { JobsSearchPage } from "@/features/jobs/pages/JobsSearchPage";
import { BrandLoader } from "@/components/feedback/BrandLoader";

export const metadata: Metadata = {
  title: "Search Jobs | Career OS",
  description: "Browse verified fresher and early-career job openings across India.",
};

export default function JobsPage() {
  return (
    <Suspense fallback={<BrandLoader message="Loading verified jobs..." />}>
      <JobsSearchPage />
    </Suspense>
  );
}
