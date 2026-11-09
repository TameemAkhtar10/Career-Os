import { Metadata } from "next";
import { PrivacyPage } from "@/features/legal/pages/PrivacyPage";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Learn how Career OS protects your privacy, manages candidate resumes, and empowers you with full data sovereignty.",
  alternates: {
    canonical: "/privacy",
  },
};

export default function Page() {
  return <PrivacyPage />;
}

