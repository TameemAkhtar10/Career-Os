import { Metadata } from "next";
import { OfflinePage } from "../../features/system/pages/OfflinePage";

export const metadata: Metadata = {
  title: "Offline",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <OfflinePage />;
}

