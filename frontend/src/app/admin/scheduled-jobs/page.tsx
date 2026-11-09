import { Metadata } from "next";
import { ScheduledJobsPage } from "@/features/admin/pages/ScheduledJobsPage";

export const metadata: Metadata = {
  title: {
    absolute: "Scheduled Jobs | Career OS Admin",
  },
  robots: { index: false, follow: false },
};

export default function Page() {
  return <ScheduledJobsPage />;
}

