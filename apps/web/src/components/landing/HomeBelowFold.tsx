import dynamic from "next/dynamic"

import type { LandingFaqCopy } from "@/i18n/getLandingFaq"

import LandingFaq from "./LandingFaq"

/** Split heavier sections into separate chunks so less JS competes with hero LCP on slow networks. */
const LandingMarketingSections = dynamic(() => import("./LandingMarketingSections"), { ssr: true })
const BentoFeatures = dynamic(() => import("./BentoFeatures"), { ssr: true })
const LandingFinalCta = dynamic(() => import("./LandingFinalCta"), { ssr: true })
const CtaFooter = dynamic(() => import("./CtaFooter"), { ssr: true })

export default function HomeBelowFold({ faq }: { faq: LandingFaqCopy }) {
  return (
    <>
      <LandingMarketingSections />
      <BentoFeatures />
      <LandingFaq title={faq.title} items={faq.items} />
      <LandingFinalCta />
      <CtaFooter />
    </>
  )
}
