import { Metadata } from "next";
import { JobApplicantsPage } from "@/features/applications/pages/JobApplicantsPage";

export const dynamic = "force-dynamic";

interface PageProps {
  params: { id: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  return {
    title: "Job Applicants | Career OS",
    description: "Evaluate candidate applications, review skills match scores, and advance candidates.",
    robots: { index: false, follow: false },
  };
}

export default function ApplicantsPage({ params }: PageProps) {
  return <JobApplicantsPage jobId={params.id} />;
}
