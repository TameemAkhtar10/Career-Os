import { Metadata } from "next";
import { ForbiddenPage } from "../../features/system/pages/ForbiddenPage";

export const metadata: Metadata = {
  title: "403 Access Denied",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <ForbiddenPage />;
}

