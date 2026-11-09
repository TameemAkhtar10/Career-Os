import { Metadata } from "next";
import { AboutPage } from "@/features/marketing/pages/AboutPage";
import { absoluteUrl } from "@/lib/siteUrl";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn about Career OS: the modern hiring operating system designed for genuine fresher opportunities and privacy-first recruitment.",
  alternates: {
    canonical: absoluteUrl("/about"),
  },
  openGraph: {
    title: "About Us | Career OS",
    description:
      "Learn about Career OS: the modern hiring operating system designed for genuine fresher opportunities and privacy-first recruitment.",
    url: absoluteUrl("/about"),
  },
};

export default function Page() {
  return <AboutPage />;
}

