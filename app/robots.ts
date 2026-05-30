import type { MetadataRoute } from "next";

// Canonical domain — keep in sync with sitemap.ts and layout.tsx metadataBase.
const SITE_URL = "https://linerup.bet";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/health"] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
