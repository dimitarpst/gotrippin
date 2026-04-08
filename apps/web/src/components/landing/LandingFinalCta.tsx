"use client"

import { motion, useReducedMotion } from "framer-motion"
import { ArrowRight } from "lucide-react"
import Link from "next/link"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/AuthContext"

export default function LandingFinalCta() {
  const { user } = useAuth()
  const { t } = useTranslation()
  const reduceMotion = useReducedMotion()

  return (
    <motion.section
      className="relative overflow-hidden border-t border-border bg-muted/40 py-24 px-6 text-foreground dark:border-transparent dark:bg-zinc-950 dark:text-white"
      initial={reduceMotion ? false : { opacity: 0, y: 20 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5 }}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-15%,rgba(255,118,112,0.1),transparent)] dark:hidden"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 hidden bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(255,118,112,0.35),transparent)] dark:block"
        aria-hidden
      />
      <div className="relative z-10 mx-auto max-w-3xl text-center">
        <h2 className="font-display mb-4 text-3xl font-bold tracking-tight sm:text-5xl">{t("landing.final_cta.title")}</h2>
        <p className="mb-10 text-lg text-muted-foreground dark:text-white/70">{t("landing.final_cta.sub")}</p>
        <Link href={user ? "/trips" : "/auth"}>
          <Button
            size="lg"
            className="h-14 rounded-full bg-primary px-10 text-base font-semibold text-zinc-950 shadow-lg shadow-primary/25 hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background dark:shadow-primary/30 dark:focus-visible:ring-white dark:focus-visible:ring-offset-zinc-950"
          >
            <span className="flex items-center">
              {user ? t("landing.final_cta.cta_open") : t("landing.final_cta.cta_start")}
              <ArrowRight className="ml-2 w-5 h-5" aria-hidden />
            </span>
          </Button>
        </Link>
      </div>
    </motion.section>
  )
}
