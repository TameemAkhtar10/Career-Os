import { Metadata } from "next";
import { Suspense } from "react";
import { RegisterPage } from "../../../features/auth/pages/RegisterPage";
import { BrandLoader } from "@/components/feedback/BrandLoader";

export const metadata: Metadata = {
  title: "Create Account",
  description: "Register on Career OS as a candidate or recruiter.",
};

export default function Page() {
  return (
    <Suspense fallback={<BrandLoader message="Loading registration..." />}>
      <RegisterPage />
    </Suspense>
  );
}

