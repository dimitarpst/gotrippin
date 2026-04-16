import dynamic from "next/dynamic"

import LandingFaq from "./LandingFaq"

/** Split heavier sections into separate chunks so less JS competes with hero LCP on slow networks. */
const LandingMarketingSections = dynamic(() => import("./LandingMarketingSections"), { ssr: true })
const BentoFeatures = dynamic(() => import("./BentoFeatures"), { ssr: true })
const LandingFinalCta = dynamic(() => import("./LandingFinalCta"), { ssr: true })
const CtaFooter = dynamic(() => import("./CtaFooter"), { ssr: true })

export default function HomeBelowFold() {
  return (
    <>
      <LandingMarketingSections />
      <BentoFeatures />
      <LandingFaq />
      <LandingFinalCta />
      <CtaFooter />
    </>
  )
}
