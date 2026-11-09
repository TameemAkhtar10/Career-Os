import { Metadata } from "next";
import { FaqPage } from "@/features/marketing/pages/FaqPage";

export const metadata: Metadata = {
  title: "Frequently Asked Questions",
  description:
    "Find answers to common questions about candidate applications, resume privacy, recruiter workflows, and email notifications on Career OS.",
  alternates: {
    canonical: "/faq",
  },
};

export default function Page() {
  return <FaqPage />;
}

