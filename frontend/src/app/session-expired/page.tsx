import { Metadata } from "next";
import { SessionExpiredPage } from "../../features/system/pages/SessionExpiredPage";

export const metadata: Metadata = {
  title: "Session Expired",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <SessionExpiredPage />;
}

