import type { LandingHeroCopy } from "@/i18n/getLandingHero"

import HeroMockupDeferred from "./HeroMockupDeferred"
import HeroTopServer from "./HeroTopServer"

/**
 * Server component: hero copy is not nested under a client parent (better mobile LCP).
 * Mockup is a separate client chunk (`HeroMockupDeferred`) but still SSR’d (`ssr: true`).
 */
export default function HomeHeroSection({
  signedIn,
  heroCopy,
}: {
  signedIn: boolean
  heroCopy: LandingHeroCopy
}) {
  return (
    <section className="relative min-h-[100svh] flex flex-col items-center justify-center pt-32 pb-48 overflow-hidden">
      <HeroTopServer signedIn={signedIn} hero={heroCopy} />
      <HeroMockupDeferred />
    </section>
  )
}
