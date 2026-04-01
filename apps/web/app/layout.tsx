import "@fontsource/figtree/latin.css";
import "./globals.css";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import I18nProvider from "../src/i18n/I18nProvider";
import { AuthProvider } from "../src/contexts/AuthContext";
import { Toaster } from "@/components/ui/sonner";
import {
  DEFAULT_LANGUAGE,
  PREFERRED_LANGUAGE_COOKIE,
  SupportedLanguage,
  isSupportedLanguage,
} from "../src/i18n/config";
import { appConfig } from "@/config/appConfig";
import { ThemeProvider } from "@/components/theme-provider";

const siteUrl = appConfig.siteUrl || "https://gotrippin.app";
const defaultTitle = "gotrippin — travel planning made simple";
const defaultDescription =
  "Plan trips together without the chaos. gotrippin is a route-first trip planner: build your route, invite others, and let AI suggest the rest. Interactive maps, AI assistant, shareable itineraries.";

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: "gotrippin",
      url: siteUrl,
      logo: { "@type": "ImageObject", url: `${siteUrl}/logo_gotrippin.png` },
      description: defaultDescription,
    },
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      url: siteUrl,
      name: "gotrippin",
      description: defaultDescription,
      publisher: { "@id": `${siteUrl}/#organization` },
      inLanguage: ["en", "bg"],
    },
    {
      "@type": "WebApplication",
      "@id": `${siteUrl}/#webapp`,
      name: "gotrippin",
      applicationCategory: "TravelApplication",
      description: defaultDescription,
      url: siteUrl,
    },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: defaultTitle, template: "%s | gotrippin" },
  description: defaultDescription,
  keywords: [
    "trip planner",
    "travel itinerary",
    "route planner",
    "AI travel assistant",
    "share trips",
    "group travel",
  ],
  authors: [{ name: "gotrippin", url: siteUrl }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "gotrippin",
    title: defaultTitle,
    description: defaultDescription,
    images: [{ url: "/logo_gotrippin.png", width: 512, height: 512, alt: "gotrippin logo" }],
  },
  twitter: {
    card: "summary",
    title: defaultTitle,
    description: defaultDescription,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: "/apple-touch-icon.png",
  },
  alternates: {
    canonical: siteUrl,
  },
};

const resolveInitialLanguage = async (): Promise<SupportedLanguage> => {
  const cookieStore = await cookies();
  const cookieLanguage = cookieStore.get(PREFERRED_LANGUAGE_COOKIE)?.value;
  return isSupportedLanguage(cookieLanguage) ? cookieLanguage : DEFAULT_LANGUAGE;
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const initialLanguage = await resolveInitialLanguage();

  const jsonLdStr = JSON.stringify(jsonLd).replace(/</g, "\\u003c");

  return (
    <html lang={initialLanguage} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdStr }}
        />
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <I18nProvider initialLanguage={initialLanguage}>
              {children}
              <Toaster position="top-center" expand={true} richColors />
            </I18nProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
