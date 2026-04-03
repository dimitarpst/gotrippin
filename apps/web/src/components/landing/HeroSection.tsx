"use client"

import dynamic from "next/dynamic"
import HeroTop from "./HeroTop"

const HeroMockup = dynamic(() => import("./HeroMockup"), { ssr: true })

export default function HeroSection() {
  return (
    <section className="relative min-h-[100svh] flex flex-col items-center justify-center pt-32 pb-48 overflow-hidden">
      <HeroTop />
      <HeroMockup />
    </section>
  )
}
