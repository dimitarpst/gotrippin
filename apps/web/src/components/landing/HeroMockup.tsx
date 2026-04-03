"use client"

import { motion } from "framer-motion"
import { Calendar } from "lucide-react"
import Image from "next/image"

/** ~2× displayed width on mobile (~360px) to save bytes vs 640w source */
const HERO_MAP_UNSPLASH =
  "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=400&h=268&q=62"

const HERO_CARD_UNSPLASH =
  "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=260&h=174&q=42"

export default function HeroMockup() {
  return (
    <motion.div
      className="relative z-20 w-full max-w-5xl mx-auto mt-32 px-6 perspective-[2000px]"
      initial={{ opacity: 0, y: 100, rotateX: 20 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ duration: 1.2, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[110%] h-[110%] bg-gradient-to-r from-primary/20 via-indigo-500/12 to-purple-500/12 dark:from-[#ff7670]/15 dark:via-indigo-500/15 dark:to-purple-500/15 blur-[100px] -z-10 rounded-[4rem]" />

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
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-border to-transparent z-20 dark:via-white/20" />

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

        <div className="absolute inset-0 pt-16 grid grid-cols-1 grid-rows-[1fr_1.2fr] md:grid-rows-1 md:grid-cols-[1fr_350px] lg:grid-cols-[1fr_400px]">
          <div className="relative w-full h-full bg-muted/30 flex items-center justify-center overflow-hidden dark:bg-black/20">
            <Image
              src={HERO_MAP_UNSPLASH}
              alt="Kyoto map aesthetic background in product mockup"
              fill
              className="object-cover opacity-30 mix-blend-luminosity grayscale"
              sizes="(max-width: 768px) 75vw, 42vw"
              quality={60}
              loading="lazy"
              fetchPriority="low"
            />

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

          <div className="relative w-full h-full border-t md:border-t-0 md:border-l border-border bg-card/50 backdrop-blur-xl p-4 sm:p-6 flex flex-col gap-3 sm:gap-4 overflow-hidden shadow-sm dark:border-white/[0.05] dark:bg-white/[0.01] dark:shadow-[-20px_0_40px_rgba(0,0,0,0.3)]">
            <div className="h-24 sm:h-40 shrink-0 rounded-2xl overflow-hidden relative mb-2 sm:mb-4 ring-1 ring-border dark:ring-white/10">
              <Image
                src={HERO_CARD_UNSPLASH}
                alt="Trip cover preview in mockup"
                fill
                className="object-cover"
                sizes="(max-width: 640px) 70vw, 240px"
                quality={35}
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
  )
}
