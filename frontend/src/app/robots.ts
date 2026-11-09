import { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/siteUrl";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getSiteUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/candidate", "/recruiter", "/admin", "/account", "/api"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

