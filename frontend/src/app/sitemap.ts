import { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001";
  const backendUrl = process.env.BACKEND_URL || "http://localhost:3000";

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/jobs`,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/register`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  try {
    const res = await fetch(`${backendUrl}/api/jobs?limit=50`, {
      next: { revalidate: 60 },
    });

    if (!res.ok) return staticRoutes;

    const data = await res.json();
    const jobs = data?.data?.jobs || [];

    const jobRoutes: MetadataRoute.Sitemap = jobs.map((job: any) => ({
      url: `${baseUrl}/jobs/${job._id}`,
      lastModified: new Date(job.updatedAt || job.createdAt || Date.now()),
      changeFrequency: "daily",
      priority: 0.8,
    }));

    return [...staticRoutes, ...jobRoutes];
  } catch {
    return staticRoutes;
  }
}

