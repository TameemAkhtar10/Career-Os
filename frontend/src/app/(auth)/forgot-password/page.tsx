import { Metadata } from "next";
import { ForgotPasswordPage } from "../../../features/auth/pages/ForgotPasswordPage";

export const metadata: Metadata = {
  title: "Forgot Password",
  description: "Request a password reset code for your Career OS account.",
};

export default function Page() {
  return <ForgotPasswordPage />;
}

