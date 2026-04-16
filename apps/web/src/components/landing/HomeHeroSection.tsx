import type { LandingHeroCopy } from "@/i18n/getLandingHero"

import HeroTopServer from "./HeroTopServer"

/** Server component: hero copy is not nested under a client parent (better mobile LCP). */
export default function HomeHeroSection({
  signedIn,
  heroCopy,
}: {
  signedIn: boolean
  heroCopy: LandingHeroCopy
}) {
  return (
    <section className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden pt-32 pb-24">
      <HeroTopServer signedIn={signedIn} hero={heroCopy} />
    </section>
  )
}
