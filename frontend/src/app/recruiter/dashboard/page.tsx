import { Metadata } from "next";
import { RecruiterDashboardPage } from "@/features/recruiter/pages/RecruiterDashboardPage";

export const metadata: Metadata = {
  title: "Recruiter Dashboard | Career OS",
  description: "Track hiring metrics, active job postings, and review applicants.",
  robots: { index: false, follow: false },
};

export default function DashboardPage() {
  return <RecruiterDashboardPage />;
}
