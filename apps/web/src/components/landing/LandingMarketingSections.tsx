"use client"

import type { ReactNode } from "react"

import { motion, useReducedMotion } from "framer-motion"
import { Eye, Map, Pencil, Sparkles, Users } from "lucide-react"
import { useTranslation } from "react-i18next"

function Band({
  id,
  eyebrow,
  title,
  body,
  children,
  className = "",
}: {
  id?: string
  eyebrow: string
  title: string
  body: string
  children?: ReactNode
  className?: string
}) {
  const reduceMotion = useReducedMotion()
  return (
    <motion.section
      id={id}
      className={`py-24 px-6 scroll-mt-24 ${className}`}
      initial={reduceMotion ? false : { opacity: 0, y: 28 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="max-w-3xl mx-auto text-center">
        <p className="text-sm font-semibold tracking-wide text-primary mb-3">{eyebrow}</p>
        <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-5 dark:text-white">{title}</h2>
        <p className="text-lg text-muted-foreground leading-relaxed dark:text-white/65">{body}</p>
      </div>
      {children ? <div className="max-w-5xl mx-auto mt-12">{children}</div> : null}
    </motion.section>
  )
}

export default function LandingMarketingSections() {
  const { t } = useTranslation()

  return (
    <div className="relative border-t border-border dark:border-white/10">
      <Band id="story" eyebrow={t("landing.story.eyebrow")} title={t("landing.story.title")} body={t("landing.story.body")} />

      <Band
        id="map"
        eyebrow={t("landing.map_section.eyebrow")}
        title={t("landing.map_section.title")}
        body={t("landing.map_section.body")}
        className="bg-muted/30 dark:bg-white/[0.02]"
      >
        <div className="rounded-2xl border border-dashed border-border bg-background/60 px-6 py-10 text-center text-muted-foreground dark:border-white/10 dark:bg-black/20 dark:text-white/55">
          <Map className="w-10 h-10 mx-auto mb-4 text-primary opacity-80" aria-hidden />
          <p className="text-sm max-w-md mx-auto">{t("landing.map_section.placeholder")}</p>
        </div>
      </Band>

      <Band id="ai" eyebrow={t("landing.ai_section.eyebrow")} title={t("landing.ai_section.title")} body={t("landing.ai_section.body")}>
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-3 rounded-2xl border border-border bg-card/80 px-6 py-4 dark:border-white/10 dark:bg-white/[0.04]">
            <Sparkles className="w-6 h-6 text-indigo-500 dark:text-indigo-300" aria-hidden />
            <span className="text-sm text-muted-foreground dark:text-white/70">{t("landing.ai_section.card")}</span>
          </div>
        </div>
      </Band>

      <Band
        id="together"
        eyebrow={t("landing.together_section.eyebrow")}
        title={t("landing.together_section.title")}
        body={t("landing.together_section.body")}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-3xl mx-auto">
          <div className="rounded-2xl border border-border bg-card p-6 text-left shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
            <div className="flex items-center gap-2 text-primary font-semibold mb-2">
              <Eye className="w-5 h-5" aria-hidden />
              {t("landing.together_section.view_title")}
            </div>
            <p className="text-sm text-muted-foreground dark:text-white/60">{t("landing.together_section.view_body")}</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6 text-left shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
            <div className="flex items-center gap-2 text-primary font-semibold mb-2">
              <Pencil className="w-5 h-5" aria-hidden />
              {t("landing.together_section.edit_title")}
            </div>
            <p className="text-sm text-muted-foreground dark:text-white/60">{t("landing.together_section.edit_body")}</p>
          </div>
        </div>
        <p className="text-center text-xs text-muted-foreground mt-8 max-w-xl mx-auto dark:text-white/45">
          <Users className="w-4 h-4 inline-block align-text-bottom mr-1" aria-hidden />
          {t("landing.together_section.footnote")}
        </p>
      </Band>
    </div>
  )
}
