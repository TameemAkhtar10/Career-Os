import { Metadata } from "next";
import { CandidateProfilePage } from "@/features/profile/pages/CandidateProfilePage";

export const metadata: Metadata = {
  title: "Candidate Profile | Career OS",
  description: "Manage your candidate profile, skills, education, and portfolio.",
  robots: { index: false, follow: false },
};

export default function ProfilePage() {
  return <CandidateProfilePage />;
}
