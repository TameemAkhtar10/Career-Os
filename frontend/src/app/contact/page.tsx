import { Metadata } from "next";
import { ContactPage } from "@/features/marketing/pages/ContactPage";
import { absoluteUrl } from "@/lib/siteUrl";

export const metadata: Metadata = {
  title: "Contact Support",
  description:
    "Get in touch with the Career OS support team for assistance with accounts, recruiter verification, or technical inquiries.",
  alternates: {
    canonical: absoluteUrl("/contact"),
  },
  openGraph: {
    title: "Contact Support | Career OS",
    description:
      "Get in touch with the Career OS support team for assistance with accounts, recruiter verification, or technical inquiries.",
    url: absoluteUrl("/contact"),
  },
};

export default function Page() {
  return <ContactPage />;
}

