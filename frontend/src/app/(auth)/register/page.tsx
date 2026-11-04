import { Metadata } from "next";
import { RegisterPage } from "../../../features/auth/pages/RegisterPage";

export const metadata: Metadata = {
  title: "Create Account",
  description: "Register on Career OS as a candidate or recruiter.",
};

export default function Page() {
  return <RegisterPage />;
}

