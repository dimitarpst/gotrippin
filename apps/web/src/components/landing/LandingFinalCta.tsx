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
      className="relative py-24 px-6 bg-zinc-950 text-white overflow-hidden"
      initial={reduceMotion ? false : { opacity: 0, y: 20 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5 }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(255,118,112,0.35),transparent)] pointer-events-none" />
      <div className="relative z-10 max-w-3xl mx-auto text-center">
        <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-tight mb-4">{t("landing.final_cta.title")}</h2>
        <p className="text-lg text-white/70 mb-10">{t("landing.final_cta.sub")}</p>
        <Link href={user ? "/trips" : "/auth"}>
          <Button
            size="lg"
            className="rounded-full px-10 h-14 text-base font-semibold bg-primary text-zinc-950 hover:bg-primary/90 shadow-lg shadow-primary/30 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
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
