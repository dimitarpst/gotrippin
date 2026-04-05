import { ArrowRight } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import type { LandingHeroCopy } from "@/i18n/getLandingHero"

/**
 * Server-rendered hero copy (LCP-friendly). CTA targets come from `signedIn` via cookies on `/home`.
 * Strings follow `preferred_language` cookie so first paint matches the user’s locale.
 */
export default function HeroTopServer({
  signedIn,
  hero,
}: {
  signedIn: boolean
  hero: LandingHeroCopy
}) {
  return (
    <>
      <div className="absolute inset-0 z-0 pointer-events-none isolate">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/25 dark:bg-[#ff7670]/20 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen" />
        <div className="absolute bottom-1/4 right-1/4 w-[30rem] h-[30rem] bg-indigo-500/15 dark:bg-indigo-500/20 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen" />
        <div className="absolute top-1/2 left-1/2 w-[40rem] h-[40rem] bg-purple-500/8 dark:bg-purple-500/10 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-4xl bg-gradient-to-b from-transparent via-[var(--color-background)] to-[var(--color-background)]" />
      </div>

      <div className="landing-hero-lcp-font relative z-10 w-full max-w-5xl mx-auto px-6 flex flex-col items-center text-center">
        <h1 className="text-5xl sm:text-7xl lg:text-8xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-foreground via-foreground/90 to-foreground/65 dark:from-white dark:via-white/95 dark:to-white/70 mb-8">
          <span className="inline sm:block">{hero.h1_line1}</span>{" "}
          <span className="inline sm:block">{hero.h1_line2}</span>
        </h1>

        <p className="max-w-2xl text-lg sm:text-xl text-muted-foreground mb-10">{hero.lead}</p>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link href={signedIn ? "/trips" : "/auth"}>
            <Button
              size="lg"
              className="relative group overflow-hidden rounded-full px-8 h-14 text-base font-semibold bg-primary text-zinc-950 hover:scale-105 transition-all duration-300 shadow-lg shadow-primary/25 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background dark:bg-white dark:text-black dark:shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] dark:focus-visible:ring-white"
            >
              <span className="relative z-10 flex items-center">
                {signedIn ? hero.cta_dashboard : hero.cta_start}
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" aria-hidden />
              </span>
              <span className="absolute inset-0 bg-gradient-to-r from-white via-indigo-200 to-white opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            </Button>
          </Link>
          <Link href="#story">
            <Button
              size="lg"
              variant="ghost"
              className="rounded-full px-8 h-14 text-base text-muted-foreground hover:text-foreground hover:bg-muted/80 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background dark:text-white/70 dark:hover:text-white dark:hover:bg-white/5 dark:focus-visible:ring-white/20"
            >
              {hero.cta_see_how}
            </Button>
          </Link>
        </div>
      </div>
    </>
  )
}
