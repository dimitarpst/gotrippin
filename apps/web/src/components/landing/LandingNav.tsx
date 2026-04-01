"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/Logo"
import { useAuth } from "@/contexts/AuthContext"
import { ThemeToggle } from "@/components/theme-toggle"

export default function LandingNav() {
  const { user } = useAuth()

  return (
    <motion.nav
      className="fixed top-0 left-0 right-0 z-50 px-6 py-6 sm:px-12 flex items-center justify-between pointer-events-none"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      <Link href="/home" className="flex items-center pointer-events-auto group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-lg group-hover:opacity-90 transition-opacity" aria-label="gotrippin home">
        <Logo className="h-10 w-auto" />
      </Link>

      <div className="pointer-events-auto flex items-center gap-1 sm:gap-2">
        <ThemeToggle className="border border-transparent hover:bg-muted/80 dark:hover:bg-white/5 dark:border-white/10" />
        <Link href={user ? "/trips" : "/auth"}>
          <Button
            className="relative group overflow-hidden rounded-full px-6 bg-muted/80 hover:bg-muted text-foreground border border-border backdrop-blur-md transition-all duration-300 hover:scale-105 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background dark:bg-white/5 dark:hover:bg-white/10 dark:text-white dark:border-white/10"
            variant="outline"
          >
            <span className="relative z-10">{user ? "Dashboard" : "Get Started"}</span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 hover:bg-white/10" />
          </Button>
        </Link>
      </div>
    </motion.nav>
  )
}
