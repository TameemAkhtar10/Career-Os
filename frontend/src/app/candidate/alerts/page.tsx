import { Metadata } from "next";
import { Suspense } from "react";
import { JobAlertsPage } from "@/features/jobs/pages/JobAlertsPage";
import { BrandLoader } from "@/components/feedback/BrandLoader";

export const metadata: Metadata = {
  title: "Job Alerts",
  description: "Configure and manage automated email job alerts on Career OS.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <Suspense fallback={<BrandLoader message="Loading job alerts..." />}>
      <JobAlertsPage />
    </Suspense>
  );
}
