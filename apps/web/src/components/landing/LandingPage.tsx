"use client"

import { motion } from "framer-motion"
import LandingNav from "./LandingNav"
import HeroSection from "./HeroSection"
import BentoFeatures from "./BentoFeatures"
import CtaFooter from "./CtaFooter"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-foreground)] overflow-x-hidden selection:bg-[#ff6b6b]/30 scroll-smooth">
      <LandingNav />
      <main>
        <HeroSection />
        <BentoFeatures />
      </main>
      <CtaFooter />
    </div>
  )
}
