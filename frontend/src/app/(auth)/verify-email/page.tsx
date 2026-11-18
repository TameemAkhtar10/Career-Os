import { Metadata } from "next";
import { Suspense } from "react";
import { VerifyEmailPage } from "../../../features/auth/pages/VerifyEmailPage";
import { BrandLoader } from "@/components/feedback/BrandLoader";

export const metadata: Metadata = {
  title: "Verify Email",
  description: "Verify your email address with the 6-digit verification code.",
};

export default function Page() {
  return (
    <Suspense fallback={<BrandLoader message="Loading verification..." />}>
      <VerifyEmailPage />
    </Suspense>
  );
}

