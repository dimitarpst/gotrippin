"use client"

import type { ReactNode } from "react"
import dynamic from "next/dynamic"

const HeroMockup = dynamic(() => import("./HeroMockup"), { ssr: true })

export default function HeroSection({ heroTop }: { heroTop: ReactNode }) {
  return (
    <section className="relative min-h-[100svh] flex flex-col items-center justify-center pt-32 pb-48 overflow-hidden">
      {heroTop}
      <HeroMockup />
    </section>
  )
}
