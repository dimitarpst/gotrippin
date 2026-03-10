import type { MetadataRoute } from "next";
import { appConfig } from "@/config/appConfig";

function getBaseUrl(): string {
  const url = appConfig.siteUrl;
  if (url) return url;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "https://gotrippin.app";
}

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getBaseUrl();

  return {
    rules: [
      {
        userAgent: ["PerplexityBot", "OAI-SearchBot", "ChatGPT-User"],
        allow: "/",
        disallow: ["/auth/", "/user", "/trips", "/ai"],
      },
      {
        userAgent: ["GPTBot", "ClaudeBot", "Google-Extended"],
        allow: "/",
        disallow: ["/auth/", "/user", "/trips", "/ai"],
      },
      {
        userAgent: ["Googlebot", "Bingbot"],
        allow: "/",
        disallow: ["/auth/", "/user", "/trips", "/ai"],
      },
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/auth/", "/user", "/trips", "/ai"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
