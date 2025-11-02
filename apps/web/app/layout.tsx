import "./globals.css";
import type { Metadata } from "next";
import I18nProvider from "../src/i18n/I18nProvider";

export const metadata: Metadata = {
  title: "Go Trippin",
  description: "Explore. Connect. Go Trippin’ — travel planning made simple.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
