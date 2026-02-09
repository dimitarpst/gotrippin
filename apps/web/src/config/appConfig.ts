export const appConfig = {
  // The public URL of the Next.js app (e.g. https://gotrippin.app).
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "",
  // The base URL of the backend API (e.g. https://api.gotrippin.app).
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? "",
} as const;

