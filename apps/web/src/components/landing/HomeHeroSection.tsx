import HeroTopServer from "./HeroTopServer"
import HeroMockupDeferred from "./HeroMockupDeferred"

/**
 * Server component: hero copy is not nested under a client parent (better mobile LCP).
 * Mockup is a separate client chunk (`HeroMockupDeferred`) but still SSR’d (`ssr: true`).
 */
export default function HomeHeroSection({ signedIn }: { signedIn: boolean }) {
  return (
    <section className="relative min-h-[100svh] flex flex-col items-center justify-center pt-32 pb-48 overflow-hidden">
      <HeroTopServer signedIn={signedIn} />
      <HeroMockupDeferred />
    </section>
  )
}
