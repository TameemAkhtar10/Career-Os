import { Metadata } from "next";
import { AboutPage } from "@/features/marketing/pages/AboutPage";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn about Career OS: the modern hiring operating system designed for genuine fresher opportunities and privacy-first recruitment.",
  alternates: {
    canonical: "/about",
  },
};

export default function Page() {
  return <AboutPage />;
}

