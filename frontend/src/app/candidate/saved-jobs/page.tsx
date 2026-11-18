import { Metadata } from "next";
import { Suspense } from "react";
import { SavedJobsPage } from "@/features/jobs/pages/SavedJobsPage";
import { BrandLoader } from "@/components/feedback/BrandLoader";

export const metadata: Metadata = {
  title: "Saved Jobs",
  description: "View and manage your bookmarked jobs on Career OS.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <Suspense fallback={<BrandLoader message="Loading saved jobs..." />}>
      <SavedJobsPage />
    </Suspense>
  );
}
