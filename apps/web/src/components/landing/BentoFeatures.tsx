"use client"

import type { ReactNode } from "react"
import { motion, useReducedMotion } from "framer-motion"
import { Link2, Map, type LucideIcon } from "lucide-react"
import { useTranslation } from "react-i18next"

import { GoAiWordmark } from "@/components/ai/go-ai-wordmark"
import { cn } from "@/lib/utils"

export default function BentoFeatures() {
  const { t } = useTranslation()
  const reduceMotion = useReducedMotion()

  const features: Array<{
    key: "map" | "ai" | "share"
    icon?: LucideIcon
    useGoaiLogo?: boolean
    className: string
    illustration: ReactNode
  }> = [
    {
      key: "map",
      icon: Map,
      className:
        "md:col-span-2 md:row-span-2 bg-gradient-to-br from-muted/60 to-transparent ring-1 ring-border dark:from-white/[0.03] dark:ring-white/5",
      illustration: (
        <div className="absolute right-8 bottom-8 left-8 top-8 flex items-center justify-end md:justify-center overflow-hidden">
          <motion.svg
            className="w-full max-w-sm h-auto opacity-30 group-hover:opacity-60 transition-opacity duration-700"
            viewBox="0 0 200 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <motion.path
              d="M 30 90 L 70 60 L 110 75 L 170 30"
              stroke="url(#bento-route-grad)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              transition={{ duration: 2, ease: "easeOut" }}
            />
            <circle cx="30" cy="90" r="4" fill="#ff7670" className="drop-shadow-[0_0_8px_#ff7670]" />
            <circle cx="70" cy="60" r="3" fill="white" fillOpacity="0.8" />
            <circle cx="110" cy="75" r="3" fill="white" fillOpacity="0.8" />
            <circle cx="170" cy="30" r="4" fill="#6366f1" className="drop-shadow-[0_0_8px_#6366f1]" />
            <defs>
              <linearGradient id="bento-route-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ff7670" />
                <stop offset="100%" stopColor="#6366f1" />
              </linearGradient>
            </defs>
          </motion.svg>
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[var(--color-background)] to-transparent pointer-events-none" />
        </div>
      )
    },
    {
      key: "ai",
      useGoaiLogo: true,
      className:
        "md:col-span-1 md:row-span-1 bg-gradient-to-br from-indigo-500/8 to-transparent ring-1 ring-border dark:from-indigo-500/10 dark:ring-white/5",
      illustration: (
        <div
          aria-hidden
          className="pointer-events-none absolute right-4 top-24 bottom-8 hidden w-20 rounded-2xl border border-indigo-500/20 bg-gradient-to-b from-indigo-500/10 to-transparent md:right-6 md:top-6 md:block md:w-24"
        />
      )
    },
    {
      key: "share",
      icon: Link2,
      className:
        "md:col-span-1 md:row-span-1 bg-gradient-to-br from-primary/12 to-transparent ring-1 ring-border dark:from-[#ff7670]/10 dark:ring-white/5",
      illustration: (
        <div className="absolute right-6 bottom-6 px-3 py-1.5 rounded-lg bg-muted/80 border border-border font-mono text-xs text-muted-foreground tracking-wider dark:bg-white/5 dark:border-white/10 dark:text-white/40">
          /trips/your-link
        </div>
      )
    }
  ]

  return (
    <section id="features" className="py-32 px-6 max-w-7xl mx-auto relative z-10 scroll-mt-24">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl h-[600px] bg-indigo-500/5 blur-[120px] pointer-events-none -z-10 rounded-full" />
      <div className="text-center mb-20">
        <motion.h2
          className="font-display text-4xl sm:text-5xl font-bold tracking-tight mb-6 text-foreground"
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
        >
          {t("landing.bento.section_title")}
        </motion.h2>
        <motion.p
          className="text-lg text-muted-foreground max-w-2xl mx-auto"
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ delay: 0.1 }}
        >
          {t("landing.bento.section_lead")}
        </motion.p>
      </div>

      <div className="grid grid-cols-1 gap-6 auto-rows-min md:grid-cols-3 md:auto-rows-[250px]">
        {features.map((feature, i) => (
          <motion.div
            key={feature.key}
            className={`relative rounded-3xl border border-border overflow-hidden group hover:border-primary/25 transition-colors dark:border-white/10 dark:hover:border-white/20 ${feature.className}`}
            initial={reduceMotion ? false : { opacity: 0, y: 20 }}
            whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: i * 0.1, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="absolute inset-0 bg-transparent group-hover:bg-muted/30 transition-colors duration-500 dark:group-hover:bg-white/[0.02]" />

            <div className="relative z-10 flex h-full min-h-0 flex-col p-8">
              <div
                className={cn(
                  "mb-6 flex shrink-0 items-center justify-center rounded-2xl border border-border bg-muted backdrop-blur-md transition-colors duration-300 group-hover:border-primary/30 dark:bg-white/10 dark:border-white/10 dark:group-hover:border-white/15",
                  feature.useGoaiLogo ? "min-h-12 w-full max-w-[10rem] px-2 py-1.5" : "h-12 w-12",
                )}
              >
                {feature.useGoaiLogo ? (
                  <GoAiWordmark alt={t("landing.bento.goai_logo_alt")} className="h-7 w-full max-h-8 object-contain object-left" />
                ) : (
                  feature.icon && <feature.icon className="h-6 w-6 text-primary dark:text-white" aria-hidden />
                )}
              </div>
              <h3 className="font-display text-2xl font-bold text-foreground mb-3 dark:text-white">{t(`landing.bento.${feature.key}_title`)}</h3>
              <p className="max-w-sm text-pretty text-[15px] leading-relaxed text-muted-foreground md:max-w-[min(100%,20rem)] dark:text-white/60">
                {t(`landing.bento.${feature.key}_desc`)}
              </p>
            </div>

            {feature.illustration}
          </motion.div>
        ))}
      </div>
    </section>
  )
}
