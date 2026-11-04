import { Metadata } from "next";
import { VerifyEmailPage } from "../../../features/auth/pages/VerifyEmailPage";

export const metadata: Metadata = {
  title: "Verify Email",
  description: "Verify your email address with the 6-digit verification code.",
};

export default function Page() {
  return <VerifyEmailPage />;
}

