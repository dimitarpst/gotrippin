import type { Metadata } from "next"
import Link from "next/link"

import { appConfig } from "@/config/appConfig"

const siteUrl = appConfig.siteUrl || "https://gotrippin.app"

export const metadata: Metadata = {
  title: "Privacy",
  description: "Privacy information for gotrippin. Full policy is in preparation.",
  alternates: { canonical: `${siteUrl}/privacy` },
  robots: { index: false, follow: true },
}

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background text-foreground px-6 py-24 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold font-display mb-6">Privacy</h1>
      <p className="text-muted-foreground mb-6 leading-relaxed">
        {
          "We are preparing a complete privacy policy that describes what gotrippin collects, how we use it, and your choices. This page will be updated before we ask for broad indexing or marketing spend."
        }
      </p>
      <h2 className="text-xl font-semibold font-display mb-3 mt-10">Cookies</h2>
      <p className="text-muted-foreground mb-4 leading-relaxed">
        {
          "Today gotrippin sets only what is needed to run the service: authentication session cookies from Supabase (so you can stay signed in securely), and a first-party language preference cookie so the site can show Bulgarian or English consistently. Dismissing the cookie notice is remembered for your browser session only (session storage), not for cross-site tracking. The small notice at the bottom appears only on public pages (home and legal stubs), not inside the trip dashboard."
        }
      </p>
      <p className="text-muted-foreground mb-6 leading-relaxed">
        {"For security or privacy questions today, please open an issue on GitHub so we can respond in writing."}
      </p>
      <p className="text-sm text-muted-foreground">
        <Link href="/home" className="text-primary hover:underline">
          Back to home
        </Link>
      </p>
    </main>
  )
}
