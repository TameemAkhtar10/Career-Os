import { Metadata } from "next";
import { SavedJobsPage } from "@/features/jobs/pages/SavedJobsPage";

export const metadata: Metadata = {
  title: "Saved Jobs",
  description: "View and manage your bookmarked jobs on Career OS.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <SavedJobsPage />;
}
