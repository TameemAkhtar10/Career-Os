import { Metadata } from "next";
import { AccountPage } from "@/features/account/pages/AccountPage";

export const metadata: Metadata = {
  title: "Account Settings | Career OS",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <AccountPage />;
}

