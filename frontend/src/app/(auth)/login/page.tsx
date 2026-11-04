import { Metadata } from "next";
import { LoginPage } from "../../../features/auth/pages/LoginPage";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to Career OS to access verified fresher opportunities and recruitment tools.",
};

export default function Page() {
  return <LoginPage />;
}

