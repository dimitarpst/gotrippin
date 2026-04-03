"use client"

import { ArrowRight, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useAuth } from "@/contexts/AuthContext"

/**
 * Above-the-fold hero copy without framer-motion so LCP/hydration stay light.
 * (Mockup + motion live in `HeroMockup`, loaded via `next/dynamic`.)
 */
export default function HeroTop() {
  const { user } = useAuth()

  return (
    <>
      <div className="absolute inset-0 z-0 pointer-events-none isolate">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/25 dark:bg-[#ff7670]/20 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen" />
        <div className="absolute bottom-1/4 right-1/4 w-[30rem] h-[30rem] bg-indigo-500/15 dark:bg-indigo-500/20 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen" />
        <div className="absolute top-1/2 left-1/2 w-[40rem] h-[40rem] bg-purple-500/8 dark:bg-purple-500/10 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-4xl bg-gradient-to-b from-transparent via-[var(--color-background)] to-[var(--color-background)]" />
      </div>

      <div className="relative z-10 w-full max-w-5xl mx-auto px-6 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/25 text-sm font-medium text-primary mb-8 dark:bg-white/5 dark:border-white/10 dark:text-[#ff7670]">
          <Sparkles className="w-4 h-4 shrink-0" aria-hidden />
          <span>An intelligent, route-first trip planner</span>
        </div>

        <h1 className="font-display text-5xl sm:text-7xl lg:text-8xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-foreground via-foreground/90 to-foreground/65 dark:from-white dark:via-white/95 dark:to-white/70 mb-8">
          Plan trips together
          <br className="hidden sm:block" /> without the chaos.
        </h1>

        <p className="max-w-2xl text-lg sm:text-xl text-muted-foreground mb-10">
          Ditch the messy spreadsheets and endless group chats. Build your route, invite others, and let AI suggest the rest.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link href={user ? "/trips" : "/auth"}>
            <Button
              size="lg"
              className="relative group overflow-hidden rounded-full px-8 h-14 text-base font-semibold bg-primary text-zinc-950 hover:scale-105 transition-all duration-300 shadow-lg shadow-primary/25 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background dark:bg-white dark:text-black dark:shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] dark:focus-visible:ring-white"
            >
              <span className="relative z-10 flex items-center">
                {user ? "Go to Dashboard" : "Start Planning Free"}
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" aria-hidden />
              </span>
              <span className="absolute inset-0 bg-gradient-to-r from-white via-indigo-200 to-white opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            </Button>
          </Link>
          <Link href="#features">
            <Button
              size="lg"
              variant="ghost"
              className="rounded-full px-8 h-14 text-base text-muted-foreground hover:text-foreground hover:bg-muted/80 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background dark:text-white/70 dark:hover:text-white dark:hover:bg-white/5 dark:focus-visible:ring-white/20"
            >
              See how it works
            </Button>
          </Link>
        </div>
      </div>
    </>
  )
}
