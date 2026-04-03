import type { Metadata } from "next"
import HomeBelowFold from "@/components/landing/HomeBelowFold"
import HomeHeroSection from "@/components/landing/HomeHeroSection"
import LandingNav from "@/components/landing/LandingNav"
import { appConfig } from "@/config/appConfig"
import { createServerSupabaseClient } from "@/lib/supabase-server"

export const dynamic = "force-dynamic"

const siteUrl = appConfig.siteUrl || "https://gotrippin.app"

export const metadata: Metadata = {
  title: "gotrippin — Plan trips together without the chaos",
  description:
    "Route-first trip planner. Build your route, invite others, and let AI suggest the rest. Interactive maps, AI assistant, shareable itineraries.",
  openGraph: {
    url: `${siteUrl}/home`,
    title: "gotrippin — Plan trips together without the chaos",
    description:
      "Route-first trip planner. Build your route, invite others, and let AI suggest the rest.",
  },
  alternates: { canonical: `${siteUrl}/home` },
}

export default async function HomeRoutePage() {
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
        <HomeHeroSection signedIn={signedIn} />
        <HomeBelowFold />
      </main>
    </div>
  )
}
