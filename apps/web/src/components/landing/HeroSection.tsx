"use client"

import { motion, useScroll, useTransform } from "framer-motion"
import { ArrowRight, Sparkles, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import Link from "next/link"
import { useRef } from "react"
import { useAuth } from "@/contexts/AuthContext"

/** Cropped + compressed for hero mockup; Unsplash serves modern formats via auto=format */
const HERO_UNSPLASH_SRC =
  "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=75"

export default function HeroSection() {
  const { user } = useAuth()
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  })

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"])
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0])

  return (
    <section ref={containerRef} className="relative min-h-[100svh] flex flex-col items-center justify-center pt-32 pb-48 overflow-hidden">
      {/* Aurora Background */}
      <div className="absolute inset-0 z-0">
        {/* Static blurs: Tailwind animate-pulse caused measurable CLS on mobile PSI */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/25 dark:bg-[#ff7670]/20 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen" />
        <div className="absolute bottom-1/4 right-1/4 w-[30rem] h-[30rem] bg-indigo-500/15 dark:bg-indigo-500/20 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen" />
        <div className="absolute top-1/2 left-1/2 w-[40rem] h-[40rem] bg-purple-500/8 dark:bg-purple-500/10 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-4xl bg-gradient-to-b from-transparent via-[var(--color-background)] to-[var(--color-background)]" />
      </div>

      <motion.div
        className="relative z-10 w-full max-w-5xl mx-auto px-6 flex flex-col items-center text-center"
        style={{ y, opacity }}
      >
        <motion.div
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/25 text-sm font-medium text-primary mb-8 dark:bg-white/5 dark:border-white/10 dark:text-[#ff7670]"
        >
          <Sparkles className="w-4 h-4" />
          <span>An intelligent, route-first trip planner</span>
        </motion.div>

        <motion.h1
          className="font-display text-5xl sm:text-7xl lg:text-8xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-foreground via-foreground/90 to-foreground/65 dark:from-white dark:via-white/95 dark:to-white/70 mb-8"
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          Plan trips together<br className="hidden sm:block" /> without the chaos.
        </motion.h1>

        <motion.p
          className="max-w-2xl text-lg sm:text-xl text-muted-foreground mb-10"
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          Ditch the messy spreadsheets and endless group chats. Build your route, invite others, and let AI suggest the rest.
        </motion.p>

        <motion.div
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col sm:flex-row items-center gap-4"
        >
          <Link href={user ? "/trips" : "/auth"}>
            <Button size="lg" className="relative group overflow-hidden rounded-full px-8 h-14 text-base font-semibold bg-primary text-primary-foreground hover:scale-105 transition-all duration-300 shadow-lg shadow-primary/25 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background dark:bg-white dark:text-black dark:shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] dark:focus-visible:ring-white">
              <span className="relative z-10 flex items-center">
                {user ? "Go to Dashboard" : "Start Planning Free"}
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-white via-indigo-200 to-white opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </Button>
          </Link>
          <Link href="#features">
            <Button size="lg" variant="ghost" className="rounded-full px-8 h-14 text-base text-muted-foreground hover:text-foreground hover:bg-muted/80 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background dark:text-white/70 dark:hover:text-white dark:hover:bg-white/5 dark:focus-visible:ring-white/20">
              See how it works
            </Button>
          </Link>
        </motion.div>
      </motion.div>

      {/* Floating UI Mockup */}
      <motion.div
        className="relative z-20 w-full max-w-5xl mx-auto mt-32 px-6 perspective-[2000px]"
        initial={{ opacity: 0, y: 100, rotateX: 20 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ duration: 1.2, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Glow behind the mockup */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[110%] h-[110%] bg-gradient-to-r from-primary/20 via-indigo-500/12 to-purple-500/12 dark:from-[#ff7670]/15 dark:via-indigo-500/15 dark:to-purple-500/15 blur-[100px] -z-10 rounded-[4rem]" />

        {/* Floating Badges */}
        <motion.div
          className="absolute -left-16 top-24 z-30 hidden lg:flex items-center gap-4 bg-card/95 backdrop-blur-xl border border-border shadow-lg dark:bg-black/60 dark:border-white/10 dark:shadow-[0_0_30px_rgba(0,0,0,0.5)]"
          initial={{ opacity: 0, x: -50, y: 10 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          transition={{ duration: 1, delay: 1, ease: "easeOut" }}
        >
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
            <span className="text-xl">✈️</span>
          </div>
          <div>
            <div className="text-sm font-bold text-foreground dark:text-white">Flight booked</div>
            <div className="text-xs text-muted-foreground dark:text-white/50">JAL 123 • 10:00 AM</div>
          </div>
        </motion.div>

        <motion.div
          className="absolute -right-12 bottom-32 z-30 hidden lg:flex items-center gap-4 bg-card/95 backdrop-blur-xl border border-border shadow-lg dark:bg-black/60 dark:border-white/10 dark:shadow-[0_0_30px_rgba(0,0,0,0.5)]"
          initial={{ opacity: 0, x: 50, y: 10 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          transition={{ duration: 1, delay: 1.2, ease: "easeOut" }}
        >
          <div className="flex -space-x-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 border-2 border-black/80 flex items-center justify-center text-xs font-bold text-white shadow-lg">S</div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#ff7670] to-orange-400 border-2 border-black/80 flex items-center justify-center text-xs font-bold text-white shadow-lg">M</div>
          </div>
          <div>
            <div className="text-sm font-bold text-foreground dark:text-white">Team synced</div>
            <div className="text-xs text-muted-foreground dark:text-white/50">Sarah added 2 locations</div>
          </div>
        </motion.div>

        <div className="relative rounded-3xl overflow-hidden border border-border bg-muted/40 backdrop-blur-3xl shadow-xl h-[600px] md:h-auto md:aspect-video md:max-h-[600px] ring-1 ring-border/60 dark:border-white/[0.1] dark:bg-black/50 dark:shadow-2xl dark:shadow-black/80 dark:ring-white/10">
          {/* Subtle top edge highlight */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-border to-transparent z-20 dark:via-white/20" />

          {/* Mockup Header */}
          <div className="absolute top-0 left-0 right-0 h-16 bg-muted/30 border-b border-border flex items-center px-4 sm:px-6 gap-4 z-10 dark:bg-white/[0.02] dark:border-white/[0.05]">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-muted-foreground/25 dark:bg-white/10" />
              <div className="w-3 h-3 rounded-full bg-muted-foreground/25 dark:bg-white/10" />
              <div className="w-3 h-3 rounded-full bg-muted-foreground/25 dark:bg-white/10" />
            </div>
            <div className="h-8 flex-1 max-w-md bg-background/80 rounded-lg border border-border flex items-center px-4 overflow-hidden shadow-inner dark:bg-black/40 dark:border-white/[0.05]">
              <span className="text-xs text-muted-foreground font-mono truncate tracking-wider dark:text-white/30">gotrippin.app/trips/KyoT0o9x</span>
            </div>
          </div>

          {/* Mockup Content */}
          <div className="absolute inset-0 pt-16 grid grid-cols-1 grid-rows-[1fr_1.2fr] md:grid-rows-1 md:grid-cols-[1fr_350px] lg:grid-cols-[1fr_400px]">
            {/* Map Area */}
            <div className="relative w-full h-full bg-muted/30 flex items-center justify-center overflow-hidden dark:bg-black/20">
              <Image
                src={HERO_UNSPLASH_SRC}
                alt="Kyoto map aesthetic background in product mockup"
                fill
                className="object-cover opacity-30 mix-blend-luminosity grayscale"
                sizes="(max-width: 768px) 100vw, 55vw"
                loading="lazy"
                fetchPriority="low"
              />

              {/* Route line simulation */}
              <svg className="absolute inset-0 w-full h-full opacity-40 mix-blend-screen" preserveAspectRatio="none" viewBox="0 0 100 100">
                <path d="M 20,80 Q 40,60 60,70 T 80,30" fill="none" stroke="url(#hero-route-grad)" strokeWidth="0.5" strokeDasharray="2 2" />
                <defs>
                  <linearGradient id="hero-route-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#ff7670" />
                    <stop offset="100%" stopColor="#6366f1" />
                  </linearGradient>
                </defs>
              </svg>

              <motion.div
                className="absolute w-12 h-12 rounded-full bg-black/40 border border-white/10 flex items-center justify-center backdrop-blur-md shadow-xl"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-[#ff7670] to-orange-400 shadow-[0_0_20px_#ff7670]" />
              </motion.div>
            </div>

            {/* Sidebar Area */}
            <div className="relative w-full h-full border-t md:border-t-0 md:border-l border-border bg-card/50 backdrop-blur-xl p-4 sm:p-6 flex flex-col gap-3 sm:gap-4 overflow-hidden shadow-sm dark:border-white/[0.05] dark:bg-white/[0.01] dark:shadow-[-20px_0_40px_rgba(0,0,0,0.3)]">
              <div className="h-24 sm:h-40 shrink-0 rounded-2xl overflow-hidden relative mb-2 sm:mb-4 ring-1 ring-border dark:ring-white/10">
                <Image
                  src={HERO_UNSPLASH_SRC}
                  alt="Trip cover preview in mockup"
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, 400px"
                  loading="lazy"
                  fetchPriority="low"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent flex items-end p-5 dark:from-black/90 dark:via-black/40">
                  <h2 className="font-display text-2xl font-bold text-white tracking-tight">Kyoto Summer</h2>
                </div>
              </div>

              {[
                { title: "Arrive in Kyoto", subtitle: "2 activities" },
                { title: "Bamboo Forest", subtitle: "3 activities" },
                { title: "Fushimi Inari", subtitle: "Morning hike" }
              ].map((item, i) => (
                <div key={i} className="bg-muted/40 rounded-xl p-4 border border-border flex gap-4 items-center hover:bg-muted/60 transition-colors cursor-default group dark:bg-white/[0.02] dark:border-white/[0.05] dark:hover:bg-white/[0.04]">
                  <div className="w-10 h-10 rounded-lg bg-background/80 border border-border flex items-center justify-center shrink-0 group-hover:border-primary/30 transition-colors dark:bg-black/40 dark:border-white/5 dark:group-hover:border-white/10">
                    <Calendar className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors dark:text-white/40 dark:group-hover:text-[#ff7670]" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-foreground mb-0.5 dark:text-white/90">{item.title}</div>
                    <div className="text-xs text-muted-foreground dark:text-white/40">{item.subtitle}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  )
}
