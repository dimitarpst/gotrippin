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

export const metadata: Metadata = {
  title: "gotrippin",
  description: "Explore. Connect. gotrippin — travel planning made simple.",
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: "/apple-touch-icon.png",
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

  return (
    <html lang={initialLanguage} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <AuthProvider>
          <I18nProvider initialLanguage={initialLanguage}>
            {children}
            <Toaster position="top-center" expand={true} richColors />
          </I18nProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
