import { Metadata } from "next";
import { MyApplicationsPage } from "@/features/applications/pages/MyApplicationsPage";

export const metadata: Metadata = {
  title: "My Applications | Career OS",
  description: "Track all your submitted job applications and timeline updates.",
  robots: { index: false, follow: false },
};

export default function ApplicationsPage() {
  return <MyApplicationsPage />;
}
