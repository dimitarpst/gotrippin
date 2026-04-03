"use client"

import dynamic from "next/dynamic"

const HeroMockup = dynamic(() => import("./HeroMockup"), {
  ssr: false,
  loading: () => (
    <div
      className="relative z-20 w-full max-w-5xl mx-auto mt-32 px-6 min-h-[min(520px,62svh)] md:min-h-[min(600px,56vh)] shrink-0"
      aria-hidden
    />
  ),
})

export default function HeroMockupDeferred() {
  return <HeroMockup />
}
