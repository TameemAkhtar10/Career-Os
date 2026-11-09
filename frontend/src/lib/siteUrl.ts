/**
 * Returns the canonical base URL for the Career OS frontend.
 * Priority order:
 * 1. process.env.NEXT_PUBLIC_SITE_URL
 * 2. "https://" + process.env.VERCEL_PROJECT_PRODUCTION_URL
 * 3. "http://localhost:3001"
 *
 * Trailing slashes are stripped to guarantee clean URL concatenation everywhere.
 */
export const getSiteUrl = (): string => {
  const customSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (customSiteUrl) {
    return customSiteUrl.replace(/\/+$/, "");
  }

  const vercelProdUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercelProdUrl) {
    return `https://${vercelProdUrl}`.replace(/\/+$/, "");
  }

  return "http://localhost:3001";
};

/**
 * Convenience helper returning an absolute URL for a given relative path.
 * e.g. absoluteUrl("/terms") => "https://careeros.com/terms"
 */
export const absoluteUrl = (path: string = ""): string => {
  const base = getSiteUrl();
  if (!path) return base;
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${cleanPath}`;
};

export const SITE_URL = getSiteUrl();

