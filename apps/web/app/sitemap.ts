import type { MetadataRoute } from "next";
import { appConfig } from "@/config/appConfig";

function getBaseUrl(): string {
  const url = appConfig.siteUrl;
  if (url) return url;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "https://gotrippin.app";
}

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getBaseUrl();

  // `/` redirects to `/home`; list only the canonical marketing URL to avoid duplicate sitemap entries.
  return [
    {
      url: `${baseUrl}/home`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/auth`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/explore`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    },
  ];
}
