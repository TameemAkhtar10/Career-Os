import { Metadata } from "next";
import { PrivacyPage } from "@/features/legal/pages/PrivacyPage";
import { absoluteUrl } from "@/lib/siteUrl";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Learn how Career OS protects your privacy, manages candidate resumes, and empowers you with full data sovereignty.",
  alternates: {
    canonical: absoluteUrl("/privacy"),
  },
  openGraph: {
    title: "Privacy Policy | Career OS",
    description:
      "Learn how Career OS protects your privacy, manages candidate resumes, and empowers you with full data sovereignty.",
    url: absoluteUrl("/privacy"),
  },
};

export default function Page() {
  return <PrivacyPage />;
}

