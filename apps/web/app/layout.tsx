import "./globals.css";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import I18nProvider from "../src/i18n/I18nProvider";
import { AuthProvider } from "../src/contexts/AuthContext";
import {
  DEFAULT_LANGUAGE,
  PREFERRED_LANGUAGE_COOKIE,
  SupportedLanguage,
  isSupportedLanguage,
} from "../src/i18n/config";

export const metadata: Metadata = {
  title: "Go Trippin",
  description: "Explore. Connect. Go Trippin' — travel planning made simple.",
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
    <html lang={initialLanguage}>
      <body suppressHydrationWarning>
        <AuthProvider>
          <I18nProvider initialLanguage={initialLanguage}>{children}</I18nProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
