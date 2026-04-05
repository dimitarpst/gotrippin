"use client"

import { motion } from "framer-motion"
import { Menu } from "lucide-react"
import Link from "next/link"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Logo } from "@/components/Logo"
import { useAuth } from "@/contexts/AuthContext"

const GITHUB_ISSUES = "https://github.com/dimitarpst/gotrippin/issues"

export default function LandingNav() {
  const { user } = useAuth()
  const { t } = useTranslation()

  return (
    <motion.nav
      className="fixed top-0 left-0 right-0 z-50 px-4 py-3 sm:px-8 sm:py-5 md:px-12 md:py-6 flex items-center gap-2 pointer-events-none"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      <Link
        href="/home"
        className="pointer-events-auto flex min-w-0 max-w-[min(11rem,46vw)] shrink items-center overflow-hidden rounded-lg group cursor-pointer transition-opacity group-hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:max-w-none"
        aria-label="gotrippin home"
      >
        <Logo className="h-6 max-h-6 w-auto min-w-0 sm:h-8 sm:max-h-8 md:h-10 md:max-h-10 [&_svg]:h-full [&_svg]:max-w-full [&_svg]:w-auto" />
      </Link>

      <div className="pointer-events-auto hidden min-w-0 flex-1 justify-center md:flex">
        <div className="flex items-center gap-8 text-sm font-medium text-muted-foreground dark:text-white/60">
          <Link href="#features" className="transition-colors hover:text-foreground dark:hover:text-white">
            {t("landing.nav.features")}
          </Link>
          <a
            href={GITHUB_ISSUES}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-foreground dark:hover:text-white"
          >
            {t("landing.nav.support")}
          </a>
        </div>
      </div>

      <div className="pointer-events-auto ml-auto flex shrink-0 items-center gap-2">
        <Link href={user ? "/trips" : "/auth"}>
          <Button
            className="relative group h-9 overflow-hidden rounded-full px-3 text-xs sm:h-10 sm:px-6 sm:text-sm md:h-11 bg-muted/80 text-foreground border border-border backdrop-blur-md transition-all duration-300 hover:scale-105 hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background dark:bg-white/5 dark:hover:bg-white/10 dark:text-white dark:border-white/10"
            variant="outline"
            size="default"
          >
            <span className="relative z-10 md:hidden">
              {user ? t("landing.nav.dashboard_short") : t("landing.nav.get_started_short")}
            </span>
            <span className="relative z-10 hidden md:inline">
              {user ? t("landing.nav.dashboard") : t("landing.nav.get_started")}
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100 hover:bg-white/10" />
          </Button>
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-9 w-9 shrink-0 border-border bg-muted/80 backdrop-blur-md dark:border-white/10 dark:bg-white/5 md:hidden"
              aria-label={t("landing.nav.menu_aria")}
            >
              <Menu className="size-5" aria-hidden />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem asChild>
              <Link href="#features" className="cursor-pointer">
                {t("landing.nav.features")}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a href={GITHUB_ISSUES} target="_blank" rel="noopener noreferrer" className="cursor-pointer">
                {t("landing.nav.support")}
              </a>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.nav>
  )
}
