import { Metadata } from "next";
import { JobDetailPage } from "@/features/jobs/pages/JobDetailPage";
import { absoluteUrl } from "@/lib/siteUrl";

interface PageProps {
  params: { id: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const url = absoluteUrl(`/jobs/${params.id}`);
  return {
    title: "Job Details",
    description: "View verified job role requirements, compensation, and apply directly.",
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: "Job Details | Career OS",
      description: "View verified job role requirements, compensation, and apply directly.",
      url,
    },
  };
}

export default function JobPage({ params }: PageProps) {
  return <JobDetailPage jobId={params.id} />;
}

