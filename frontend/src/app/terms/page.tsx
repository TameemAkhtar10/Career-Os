import { Metadata } from "next";
import { TermsPage } from "@/features/legal/pages/TermsPage";
import { absoluteUrl } from "@/lib/siteUrl";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Review the terms and conditions governing accounts, job postings, candidate applications, and acceptable use on Career OS.",
  alternates: {
    canonical: absoluteUrl("/terms"),
  },
  openGraph: {
    title: "Terms of Service | Career OS",
    description:
      "Review the terms and conditions governing accounts, job postings, candidate applications, and acceptable use on Career OS.",
    url: absoluteUrl("/terms"),
  },
};

export default function Page() {
  return <TermsPage />;
}

