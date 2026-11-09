import { Metadata } from "next";
import { FaqPage } from "@/features/marketing/pages/FaqPage";
import { absoluteUrl } from "@/lib/siteUrl";

export const metadata: Metadata = {
  title: "Frequently Asked Questions",
  description:
    "Find answers to common questions about candidate applications, resume privacy, recruiter workflows, and email notifications on Career OS.",
  alternates: {
    canonical: absoluteUrl("/faq"),
  },
  openGraph: {
    title: "Frequently Asked Questions | Career OS",
    description:
      "Find answers to common questions about candidate applications, resume privacy, recruiter workflows, and email notifications on Career OS.",
    url: absoluteUrl("/faq"),
  },
};

export default function Page() {
  return <FaqPage />;
}

