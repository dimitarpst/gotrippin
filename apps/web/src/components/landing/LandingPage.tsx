"use client"

import type { ReactNode } from "react"

import LandingNav from "./LandingNav"
import HeroSection from "./HeroSection"
import BentoFeatures from "./BentoFeatures"
import CtaFooter from "./CtaFooter"

export default function LandingPage({ heroTop }: { heroTop: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-primary/25 scroll-smooth">
      <LandingNav />
      <main>
        <HeroSection heroTop={heroTop} />
        <BentoFeatures />
      </main>
      <CtaFooter />
    </div>
  )
}
