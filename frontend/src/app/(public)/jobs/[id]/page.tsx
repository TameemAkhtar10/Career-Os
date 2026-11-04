import { Metadata } from "next";
import { JobDetailPage } from "@/features/jobs/pages/JobDetailPage";

interface PageProps {
  params: { id: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  return {
    title: `Job Details | Career OS`,
    description: "View verified job role requirements, compensation, and apply directly.",
  };
}

export default function JobPage({ params }: PageProps) {
  return <JobDetailPage jobId={params.id} />;
}

