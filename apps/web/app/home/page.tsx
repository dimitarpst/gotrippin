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
import { getLandingHero } from "@/i18n/getLandingHero"
import { createServerSupabaseClient } from "@/lib/supabase-server"

export const dynamic = "force-dynamic"

const siteUrl = appConfig.siteUrl || "https://gotrippin.app"

export const metadata: Metadata = {
  title: "gotrippin — Plan trips together without the chaos",
  description:
    "Trip planner for groups: shared map and timeline, AI assistant, one link so everyone sees the same plan. Start free on the web.",
  openGraph: {
    url: `${siteUrl}/home`,
    title: "gotrippin — Plan trips together without the chaos",
    description:
      "Trip planner for groups: shared map and timeline, AI assistant, one link for your crew. Start free.",
  },
  alternates: { canonical: `${siteUrl}/home` },
}

export default async function HomeRoutePage() {
  const cookieStore = await cookies()
  const rawLang = cookieStore.get(PREFERRED_LANGUAGE_COOKIE)?.value
  const lang: SupportedLanguage = isSupportedLanguage(rawLang) ? rawLang : DEFAULT_LANGUAGE
  const heroCopy = getLandingHero(lang)

  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.auth.getUser()
  if (error) {
    console.error("HomeRoutePage getUser:", error.message)
  }
  const signedIn = !error && !!data.user

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-primary/25 scroll-smooth">
      <LandingNav />
      <main>
        <HomeHeroSection signedIn={signedIn} heroCopy={heroCopy} />
        <HomeBelowFold />
      </main>
    </div>
  )
}
