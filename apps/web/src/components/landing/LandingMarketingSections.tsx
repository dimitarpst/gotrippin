"use client"

import type { ReactNode } from "react"

import { motion, useReducedMotion } from "framer-motion"
import { Eye, Map, Pencil, Smartphone, Users } from "lucide-react"

import { GoAiWordmark } from "@/components/ai/go-ai-wordmark"
import Image from "next/image"
import { useTranslation } from "react-i18next"

import { cn } from "@/lib/utils"

const MAP_BAND_IMAGE_SRC = "/landing/hero-map.webp"

type BandVariant = "center" | "editorial" | "feature" | "split" | "panel" | "callout"

function Band({
  id,
  eyebrow,
  title,
  body,
  children,
  className = "",
  variant = "center",
}: {
  id?: string
  eyebrow: string
  title: string
  body: string
  children?: ReactNode
  className?: string
  variant?: BandVariant
}) {
  const reduceMotion = useReducedMotion()

  const motionProps = {
    id,
    initial: reduceMotion ? false : { opacity: 0, y: 28 },
    whileInView: reduceMotion ? undefined : { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-80px" } as const,
    transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] as const },
  }

  if (variant === "split") {
    return (
      <motion.section
        {...motionProps}
        className={cn("scroll-mt-24 px-6 py-24", className)}
      >
        <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-12 lg:items-start lg:gap-14">
          <div className="lg:col-span-5">
            <p className="mb-3 text-sm font-semibold tracking-wide text-primary">{eyebrow}</p>
            <h2 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl dark:text-white">
              {title}
            </h2>
          </div>
          <div className="flex flex-col gap-8 lg:col-span-7">
            <p className="text-lg leading-relaxed text-muted-foreground dark:text-white/65">{body}</p>
            {children ? <div>{children}</div> : null}
          </div>
        </div>
      </motion.section>
    )
  }

  const eyebrowNode = (
    <p
      className={cn(
        "mb-3 font-semibold tracking-wide text-primary",
        variant === "callout" && "text-xs uppercase tracking-[0.2em] text-muted-foreground dark:text-white/50",
        variant === "feature" &&
          "inline-flex rounded-full bg-indigo-500/10 px-3 py-1 text-xs uppercase tracking-wider text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-200",
        variant !== "callout" && variant !== "feature" && "text-sm",
      )}
    >
      {eyebrow}
    </p>
  )

  const titleNode = (
    <h2
      className={cn(
        "font-display font-bold tracking-tight text-foreground dark:text-white",
        variant === "editorial" && "text-3xl sm:text-[2.125rem] sm:leading-tight",
        variant === "feature" && "text-3xl sm:text-4xl",
        variant === "callout" && "text-3xl sm:text-4xl",
        variant === "panel" && "text-3xl sm:text-4xl",
        variant === "center" && "mb-5 text-3xl sm:text-4xl",
        (variant === "editorial" || variant === "feature" || variant === "panel" || variant === "callout") &&
          "mb-5",
      )}
    >
      {title}
    </h2>
  )

  const bodyNode = (
    <p
      className={cn(
        "text-lg leading-relaxed text-muted-foreground dark:text-white/65",
        variant === "editorial" && "text-base sm:text-lg",
      )}
    >
      {body}
    </p>
  )

  let inner: ReactNode

  if (variant === "editorial") {
    inner = (
      <div className="mx-auto max-w-3xl border-l-4 border-primary/45 pl-6 sm:pl-8">
        {eyebrowNode}
        {titleNode}
        {bodyNode}
      </div>
    )
  } else if (variant === "feature") {
    inner = (
      <div className="mx-auto max-w-3xl text-center">
        <div className="rounded-3xl border border-indigo-500/15 bg-gradient-to-b from-indigo-500/[0.07] via-transparent to-transparent px-6 py-10 sm:px-10 dark:border-indigo-400/20 dark:from-indigo-500/10">
          {eyebrowNode}
          {titleNode}
          {bodyNode}
        </div>
      </div>
    )
  } else if (variant === "panel") {
    inner = (
      <div className="mx-auto max-w-3xl rounded-3xl border border-border bg-muted/30 px-6 py-10 text-center shadow-sm sm:px-10 dark:border-white/10 dark:bg-white/[0.04]">
        {eyebrowNode}
        {titleNode}
        {bodyNode}
      </div>
    )
  } else if (variant === "callout") {
    inner = (
      <div className="mx-auto max-w-2xl text-center">
        {eyebrowNode}
        {titleNode}
        {bodyNode}
      </div>
    )
  } else {
    inner = (
      <div className="mx-auto max-w-3xl text-center">
        {eyebrowNode}
        {titleNode}
        {bodyNode}
      </div>
    )
  }

  return (
    <motion.section {...motionProps} className={cn("scroll-mt-24 px-6 py-24", className)}>
      {inner}
      {children ? <div className="mx-auto mt-12 max-w-5xl">{children}</div> : null}
    </motion.section>
  )
}

export default function LandingMarketingSections() {
  const { t } = useTranslation()

  return (
    <div className="relative border-t border-border dark:border-white/10">
      <Band
        id="story"
        variant="editorial"
        eyebrow={t("landing.story.eyebrow")}
        title={t("landing.story.title")}
        body={t("landing.story.body")}
        className="bg-muted/25 dark:bg-white/[0.02]"
      />

      <Band
        id="map"
        variant="center"
        eyebrow={t("landing.map_section.eyebrow")}
        title={t("landing.map_section.title")}
        body={t("landing.map_section.body")}
        className="bg-muted/30 dark:bg-white/[0.02]"
      >
        <div className="relative overflow-hidden rounded-2xl border border-border bg-muted/20 shadow-sm dark:border-white/10 dark:bg-black/25">
          <div className="relative aspect-[16/10] w-full max-h-[min(420px,70vh)]">
            <Image
              src={MAP_BAND_IMAGE_SRC}
              alt={t("landing.map_section.image_alt")}
              fill
              className="object-cover object-center dark:brightness-95"
              sizes="(max-width: 768px) 100vw, 896px"
              quality={85}
            />
          </div>
          <div className="flex items-start gap-3 border-t border-border bg-background/80 px-4 py-3 text-left text-sm text-muted-foreground backdrop-blur-sm dark:border-white/10 dark:bg-black/40 dark:text-white/65">
            <Map className="mt-0.5 h-5 w-5 shrink-0 text-primary opacity-90" aria-hidden />
            <p>{t("landing.map_section.caption")}</p>
          </div>
        </div>
      </Band>

      <Band
        id="ai"
        variant="feature"
        eyebrow={t("landing.ai_section.eyebrow")}
        title={t("landing.ai_section.title")}
        body={t("landing.ai_section.body")}
      >
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-4 rounded-2xl border border-border bg-card/80 px-6 py-4 dark:border-white/10 dark:bg-white/[0.04]">
            <GoAiWordmark alt={t("landing.bento.goai_logo_alt")} className="h-7 w-auto max-w-[7rem] object-contain" />
            <span className="text-sm text-muted-foreground dark:text-white/70">{t("landing.ai_section.card")}</span>
          </div>
        </div>
      </Band>

      <Band
        id="together"
        variant="split"
        eyebrow={t("landing.together_section.eyebrow")}
        title={t("landing.together_section.title")}
        body={t("landing.together_section.body")}
      >
        <div className="flex flex-col gap-8">
          <div className="mx-auto grid max-w-3xl grid-cols-1 gap-5 sm:grid-cols-2 lg:max-w-none">
            <div className="rounded-2xl border border-border bg-card p-6 text-left shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
              <div className="mb-2 flex items-center gap-2 font-semibold text-primary">
                <Eye className="h-5 w-5" aria-hidden />
                {t("landing.together_section.view_title")}
              </div>
              <p className="text-sm text-muted-foreground dark:text-white/60">{t("landing.together_section.view_body")}</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-6 text-left shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
              <div className="mb-2 flex items-center gap-2 font-semibold text-primary">
                <Pencil className="h-5 w-5" aria-hidden />
                {t("landing.together_section.edit_title")}
              </div>
              <p className="text-sm text-muted-foreground dark:text-white/60">{t("landing.together_section.edit_body")}</p>
            </div>
          </div>
          <p className="mx-auto max-w-xl text-center text-xs text-muted-foreground dark:text-white/45">
            <Users className="mr-1 inline-block h-4 w-4 align-text-bottom" aria-hidden />
            {t("landing.together_section.footnote")}
          </p>
        </div>
      </Band>

      <Band
        id="apps"
        variant="panel"
        eyebrow={t("landing.native_apps.eyebrow")}
        title={t("landing.native_apps.title")}
        body={t("landing.native_apps.body")}
        className="bg-muted/20 dark:bg-white/[0.02]"
      >
        <div className="flex justify-center">
          <div className="inline-flex max-w-lg items-center gap-4 rounded-2xl border border-border bg-background/80 px-6 py-5 text-left shadow-sm dark:border-white/10 dark:bg-black/30">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary dark:bg-primary/15">
              <Smartphone className="h-6 w-6" aria-hidden />
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground dark:text-white/70">{t("landing.native_apps.card")}</p>
          </div>
        </div>
      </Band>

      <Band
        id="trust"
        variant="callout"
        eyebrow={t("landing.trust.eyebrow")}
        title={t("landing.trust.title")}
        body={t("landing.trust.body")}
        className="border-t border-border bg-gradient-to-b from-transparent to-muted/20 dark:border-white/10 dark:to-white/[0.02]"
      >
        <div
          id="sheets"
          className="mx-auto max-w-2xl scroll-mt-24 rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-6 text-left dark:border-white/15 dark:bg-white/[0.03]"
        >
          <p className="text-sm font-semibold text-foreground dark:text-white">{t("landing.sheets_teaser.title")}</p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground dark:text-white/65">{t("landing.sheets_teaser.body")}</p>
        </div>
      </Band>
    </div>
  )
}
