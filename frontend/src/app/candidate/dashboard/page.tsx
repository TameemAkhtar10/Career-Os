import { Metadata } from "next";
import { CandidateDashboardPage } from "@/features/candidate-dashboard/pages/CandidateDashboardPage";

export const metadata: Metadata = {
  title: "Candidate Dashboard",
  description: "Track your profile readiness, resume score, and application status.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <CandidateDashboardPage />;
}

