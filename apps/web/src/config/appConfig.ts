function trimTrailingSlash(url: string): string {
  return url.replace(/\/+$/, "");
}

export const appConfig = {
  // The public URL of the Next.js app (e.g. https://gotrippin.app).
  siteUrl: trimTrailingSlash(process.env.NEXT_PUBLIC_SITE_URL ?? ""),
  // The base URL of the backend API (e.g. https://api.gotrippin.app). No trailing slash so paths like "/trips" don't become "//trips".
  apiUrl: trimTrailingSlash(process.env.NEXT_PUBLIC_API_URL ?? ""),
} as const;

