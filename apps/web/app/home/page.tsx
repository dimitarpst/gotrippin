import type { Metadata } from "next"
import { cookies } from "next/headers"

import HomeBelowFold from "@/components/landing/HomeBelowFold"
import HomeHeroSection from "@/components/landing/HomeHeroSection"
import LandingNav from "@/components/landing/LandingNav"
import { appConfig } from "@/config/appConfig"
import {
  DEFAULT_LANGUAGE,
  PREFERRED_LANGUAGE_COOKIE,
  type SupportedLanguage,
  isSupportedLanguage,
} from "@/i18n/config"
import { getLandingFaq } from "@/i18n/getLandingFaq"
import { getLandingHero } from "@/i18n/getLandingHero"
import { createServerSupabaseClient } from "@/lib/supabase-server"

export const dynamic = "force-dynamic"

const siteUrl = appConfig.siteUrl || "https://gotrippin.app"

export const metadata: Metadata = {
  title: "gotrippin — Group trip planner: shared itinerary, map & one link",
  description:
    "Plan a group trip on the web: one shared itinerary, route on the map, AI help, and a single link so your crew sees the same plan. Free to start; native apps planned.",
  openGraph: {
    url: `${siteUrl}/home`,
    title: "gotrippin — Group trip planner: shared itinerary, map & one link",
    description:
      "Shared group trip itinerary on the web—map, timeline, AI assistant, one link for your crew. Free to start.",
  },
  twitter: {
    card: "summary_large_image",
    title: "gotrippin — Group trip planner: shared itinerary, map & one link",
    description:
      "Shared group trip itinerary on the web—map, timeline, AI assistant, one link for your crew. Free to start.",
  },
  alternates: { canonical: `${siteUrl}/home` },
}

export default async function HomeRoutePage() {
  const cookieStore = await cookies()
  const rawLang = cookieStore.get(PREFERRED_LANGUAGE_COOKIE)?.value
  const lang: SupportedLanguage = isSupportedLanguage(rawLang) ? rawLang : DEFAULT_LANGUAGE
  const heroCopy = getLandingHero(lang)
  const faqCopy = getLandingFaq(lang)

  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.auth.getUser()
  if (error) {
    console.error("HomeRoutePage getUser:", error.message)
  }
  const signedIn = !error && !!data.user

  const webApplicationJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "gotrippin",
    url: `${siteUrl}/home`,
    description:
      "Web app for planning group trips: shared itinerary, map, timeline, AI assistant, and a shareable link. Free to start. Native iOS and Android apps are planned.",
    applicationCategory: "TravelApplication",
    operatingSystem: "Any",
    browserRequirements: "Requires JavaScript. Modern browser recommended.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  }

  const faqPageJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqCopy.items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  }

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-primary/25 scroll-smooth">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webApplicationJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPageJsonLd) }}
      />
      <main>
        <div id="landing-hero-anchor" className="relative">
          <LandingNav />
          <HomeHeroSection signedIn={signedIn} heroCopy={heroCopy} />
        </div>
        <HomeBelowFold faq={faqCopy} />
      </main>
    </div>
  )
}
