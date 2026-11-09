import { Metadata } from "next";
import { ContactPage } from "@/features/marketing/pages/ContactPage";

export const metadata: Metadata = {
  title: "Contact Support",
  description:
    "Get in touch with the Career OS support team for assistance with accounts, recruiter verification, or technical inquiries.",
  alternates: {
    canonical: "/contact",
  },
};

export default function Page() {
  return <ContactPage />;
}

