import type { MetadataRoute } from "next";

// Canonical domain — keep in sync with robots.ts and layout.tsx metadataBase.
const SITE_URL = "https://linerup.bet";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${SITE_URL}`,              lastModified: now, changeFrequency: "daily",   priority: 1 },
    { url: `${SITE_URL}/mlb`,          lastModified: now, changeFrequency: "daily",   priority: 1 },
    { url: `${SITE_URL}/nba`,          lastModified: now, changeFrequency: "daily",   priority: 0.9 },
    { url: `${SITE_URL}/track-record`, lastModified: now, changeFrequency: "daily",   priority: 0.8 },
    { url: `${SITE_URL}/methodology`,  lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/about`,        lastModified: now, changeFrequency: "monthly", priority: 0.5 },
  ];
}
