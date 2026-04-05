"use client"

import { motion, useReducedMotion } from "framer-motion"
import { MapPin, Sparkles } from "lucide-react"
import Image from "next/image"
import { useTranslation } from "react-i18next"

/** Product screenshot in `public/landing/` — use a sharp source (e.g. 2× export); Next/Image quality + sizes drive retina clarity. */
const HERO_MAP_SRC = "/landing/map.png"

export default function HeroMockup() {
  const { t } = useTranslation()
  const reduceMotion = useReducedMotion()

  return (
    <motion.div
      className="relative z-20 w-full max-w-5xl mx-auto mt-32 px-6 perspective-[2000px]"
      initial={reduceMotion ? false : { opacity: 0, y: 100, rotateX: 20 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0, rotateX: 0 }}
      transition={{ duration: 1.2, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[110%] h-[110%] bg-gradient-to-r from-primary/20 via-indigo-500/12 to-purple-500/12 dark:from-[#ff7670]/15 dark:via-indigo-500/15 dark:to-purple-500/15 blur-[100px] -z-10 rounded-[4rem]" />

      <motion.div
        className="absolute -left-16 top-24 z-30 hidden lg:flex items-center gap-4 bg-card/95 backdrop-blur-xl border border-border shadow-lg dark:bg-black/60 dark:border-white/10 dark:shadow-[0_0_30px_rgba(0,0,0,0.5)]"
        initial={reduceMotion ? false : { opacity: 0, x: -50, y: 10 }}
        animate={reduceMotion ? undefined : { opacity: 1, x: 0, y: 0 }}
        transition={{ duration: 1, delay: 1, ease: "easeOut" }}
      >
        <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center border border-primary/25">
          <MapPin className="w-5 h-5 text-primary" aria-hidden />
        </div>
        <div>
          <div className="text-sm font-bold text-foreground dark:text-white">{t("landing.mockup.floater_map_title")}</div>
          <div className="text-xs text-muted-foreground dark:text-white/50">{t("landing.mockup.floater_map_sub")}</div>
        </div>
      </motion.div>

      <motion.div
        className="absolute -right-12 bottom-32 z-30 hidden lg:flex items-center gap-4 bg-card/95 backdrop-blur-xl border border-border shadow-lg dark:bg-black/60 dark:border-white/10 dark:shadow-[0_0_30px_rgba(0,0,0,0.5)]"
        initial={reduceMotion ? false : { opacity: 0, x: 50, y: 10 }}
        animate={reduceMotion ? undefined : { opacity: 1, x: 0, y: 0 }}
        transition={{ duration: 1, delay: 1.2, ease: "easeOut" }}
      >
        <div className="w-12 h-12 rounded-full bg-indigo-500/15 flex items-center justify-center border border-indigo-500/25">
          <Sparkles className="w-5 h-5 text-indigo-500 dark:text-indigo-300" aria-hidden />
        </div>
        <div>
          <div className="text-sm font-bold text-foreground dark:text-white">{t("landing.mockup.floater_ai_title")}</div>
          <div className="text-xs text-muted-foreground dark:text-white/50">{t("landing.mockup.floater_ai_sub")}</div>
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
            <span className="text-xs text-muted-foreground font-mono truncate tracking-wider dark:text-white/30">{t("landing.mockup.chrome_url")}</span>
          </div>
        </div>

        <div className="absolute inset-0 pt-16">
          <div className="relative h-full w-full bg-muted/30 overflow-hidden dark:bg-black/20">
            <Image
              src={HERO_MAP_SRC}
              alt={t("landing.mockup.alt_map")}
              fill
              className="object-cover object-center dark:opacity-90 dark:brightness-90"
              sizes="(max-width: 640px) 100vw, (max-width: 1280px) 90vw, 1200px"
              quality={92}
              priority
            />
          </div>
        </div>
      </div>
    </motion.div>
  )
}
