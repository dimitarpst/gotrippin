"use client"

import dynamic from "next/dynamic"

/** `ssr: true` keeps mockup HTML in the first response; `ssr: false` regressed mobile LCP (~2.5s render delay in PSI). */
const HeroMockup = dynamic(() => import("./HeroMockup"), { ssr: true })

export default function HeroMockupDeferred() {
  return <HeroMockup />
}
