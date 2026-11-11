import { Metadata } from "next";
import { ResumeCheckPage } from "@/features/resume-check/pages/ResumeCheckPage";

export const metadata: Metadata = {
  title: "Resume Score Checker",
  description: "Check your resume score, verify formatting & layout, and analyze keyword alignment.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <ResumeCheckPage />;
}

