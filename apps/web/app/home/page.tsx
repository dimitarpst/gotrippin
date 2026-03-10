import type { Metadata } from "next"
import LandingPage from "@/components/landing/LandingPage"
import { appConfig } from "@/config/appConfig"

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

export default function HomeRoutePage() {
  return <LandingPage />
}
