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
