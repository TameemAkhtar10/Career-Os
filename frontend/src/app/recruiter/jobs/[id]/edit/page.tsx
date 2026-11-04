import { Metadata } from "next";
import { JobFormPage } from "@/features/jobs/pages/JobFormPage";

export const dynamic = "force-dynamic";

interface PageProps {
  params: { id: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  return {
    title: "Edit Job Posting | Career OS",
    description: "Update requirements, timeline, or details for your job posting.",
    robots: { index: false, follow: false },
  };
}

export default function EditJobPage({ params }: PageProps) {
  return <JobFormPage jobId={params.id} />;
}
