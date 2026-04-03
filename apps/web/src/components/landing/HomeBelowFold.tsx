"use client"

import dynamic from "next/dynamic"

/** Split framer-heavy sections into separate chunks so less JS competes with hero LCP on slow networks. */
const BentoFeatures = dynamic(() => import("./BentoFeatures"), { ssr: true })
const CtaFooter = dynamic(() => import("./CtaFooter"), { ssr: true })

export default function HomeBelowFold() {
  return (
    <>
      <BentoFeatures />
      <CtaFooter />
    </>
  )
}
