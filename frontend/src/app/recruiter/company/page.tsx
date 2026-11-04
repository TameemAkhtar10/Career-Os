import { Metadata } from "next";
import { CompanyProfilePage } from "@/features/profile/pages/CompanyProfilePage";

export const metadata: Metadata = {
  title: "Company Profile | Career OS",
  description: "Set up and manage your employer identity, logo, and company information.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <CompanyProfilePage />;
}
