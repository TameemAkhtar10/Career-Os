import { Metadata } from "next";
import { JobFormPage } from "@/features/jobs/pages/JobFormPage";

export const metadata: Metadata = {
  title: "Post a New Job | Career OS",
  description: "Create and publish a new job opening for candidates across India.",
  robots: { index: false, follow: false },
};

export default function NewJobPage() {
  return <JobFormPage />;
}
