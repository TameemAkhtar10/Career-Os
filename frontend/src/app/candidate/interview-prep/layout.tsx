import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Interview Preparation",
  robots: {
    index: false,
    follow: false,
  },
};

export default function InterviewPrepLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
