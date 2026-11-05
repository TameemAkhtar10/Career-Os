import { Metadata } from "next";
import { AdminLayoutShell } from "@/features/admin/components/AdminLayoutShell";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <AdminLayoutShell>{children}</AdminLayoutShell>;
}

