import "./globals.css";
import type { Metadata } from "next";

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
      <body>{children}</body>
    </html>
  );
}
