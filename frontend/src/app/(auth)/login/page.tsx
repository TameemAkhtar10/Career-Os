import { Metadata } from "next";
import { Suspense } from "react";
import { LoginPage } from "../../../features/auth/pages/LoginPage";
import { BrandLoader } from "@/components/feedback/BrandLoader";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to Career OS to access verified fresher opportunities and recruitment tools.",
};

export default function Page() {
  return (
    <Suspense fallback={<BrandLoader message="Loading sign in..." />}>
      <LoginPage />
    </Suspense>
  );
}

