import { Metadata } from "next";
import { LandingPage } from "../features/jobs/pages/LandingPage";
import { getSiteUrl } from "@/lib/siteUrl";

export const revalidate = 60;

export const metadata: Metadata = {
  title: {
    absolute: "Career OS | Fresher & Recruiter Hiring Platform",
  },
  description:
    "Find your first job and launch your career. Verified fresher opportunities and high-velocity hiring.",
  alternates: {
    canonical: getSiteUrl(),
  },
  openGraph: {
    title: "Career OS | Fresher & Recruiter Hiring Platform",
    description:
      "Find your first job and launch your career. Verified fresher opportunities and high-velocity hiring.",
    url: getSiteUrl(),
  },
  twitter: {
    title: "Career OS | Fresher & Recruiter Hiring Platform",
    description:
      "Find your first job and launch your career. Verified fresher opportunities and high-velocity hiring.",
  },
};

async function getLandingData() {
  const backendUrl = process.env.BACKEND_URL || "http://localhost:3000";
  try {
    const [jobsRes, countRes] = await Promise.all([
      fetch(`${backendUrl}/api/jobs?fresher=true&limit=6`, {
        next: { revalidate: 60 },
      }),
      fetch(`${backendUrl}/api/jobs?limit=1`, {
        next: { revalidate: 60 },
      }),
    ]);

    const jobsData = jobsRes.ok ? await jobsRes.json() : null;
    const countData = countRes.ok ? await countRes.json() : null;

    return {
      jobs: jobsData?.data?.jobs || [],
      total: countData?.data?.total || 0,
      hasError: !jobsRes.ok,
    };
  } catch {
    return {
      jobs: [],
      total: 0,
      hasError: true,
    };
  }
}

export default async function Page() {
  const { jobs, total, hasError } = await getLandingData();
  return <LandingPage initialJobs={jobs} totalJobs={total} hasError={hasError} />;
}

