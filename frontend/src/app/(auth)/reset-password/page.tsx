import { Metadata } from "next";
import { Suspense } from "react";
import { ResetPasswordPage } from "../../../features/auth/pages/ResetPasswordPage";
import { BrandLoader } from "@/components/feedback/BrandLoader";

export const metadata: Metadata = {
  title: "Reset Password",
  description: "Set a new password for your Career OS account.",
};

export default function Page() {
  return (
    <Suspense fallback={<BrandLoader message="Loading reset password..." />}>
      <ResetPasswordPage />
    </Suspense>
  );
}

