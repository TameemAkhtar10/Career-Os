import { Metadata } from "next";
import { TermsPage } from "@/features/legal/pages/TermsPage";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Review the terms and conditions governing accounts, job postings, candidate applications, and acceptable use on Career OS.",
  alternates: {
    canonical: "/terms",
  },
};

export default function Page() {
  return <TermsPage />;
}

