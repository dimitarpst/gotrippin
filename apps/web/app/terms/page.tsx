import type { Metadata } from "next"
import Link from "next/link"

import { appConfig } from "@/config/appConfig"

const siteUrl = appConfig.siteUrl || "https://gotrippin.app"

export const metadata: Metadata = {
  title: "Terms — gotrippin",
  description: "Terms of use for gotrippin. Full terms are in preparation.",
  alternates: { canonical: `${siteUrl}/terms` },
  robots: { index: false, follow: true },
}

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-background text-foreground px-6 py-24 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold font-display mb-6">Terms of use</h1>
      <p className="text-muted-foreground mb-6 leading-relaxed">
        {
          "Formal terms of service are being drafted for gotrippin. Until published here, use the product at your own discretion in line with applicable law and the policies of our hosting and authentication providers."
        }
      </p>
      <p className="text-muted-foreground mb-6 leading-relaxed">
        {"Questions? Reach us via GitHub issues linked from the footer on the marketing site."}
      </p>
      <p className="text-sm text-muted-foreground">
        <Link href="/home" className="text-primary hover:underline">
          Back to home
        </Link>
      </p>
    </main>
  )
}
