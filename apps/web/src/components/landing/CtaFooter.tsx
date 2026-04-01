"use client"

import { motion } from "framer-motion"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Logo } from "@/components/Logo"
import { useAuth } from "@/contexts/AuthContext"

export default function CtaFooter() {
  const { user } = useAuth()
  return (
    <footer className="relative pt-32 pb-10 overflow-hidden border-t border-border dark:border-white/5">
      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[500px] bg-primary/15 blur-[150px] pointer-events-none rounded-full dark:bg-[#ff6b6b]/10" />

      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mb-16"
        >
          <div className="flex justify-center mb-8">
            <Logo className="h-16 w-auto" />
          </div>

          <h2 className="font-display text-5xl sm:text-6xl font-bold tracking-tight mb-6 text-foreground">
            Ready to sequence your next adventure?
          </h2>
          <p className="text-xl text-muted-foreground mb-10">
            {"Join travelers building better itineraries with gotrippin."}
          </p>

          <Link href={user ? "/trips" : "/auth"}>
            <Button size="lg" className="relative group overflow-hidden rounded-full px-10 h-16 text-lg font-semibold bg-primary text-primary-foreground hover:scale-105 transition-all duration-300 shadow-lg shadow-primary/20 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background dark:bg-white dark:text-black dark:shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] dark:focus-visible:ring-white">
              <span className="relative z-10 flex items-center">
                {user ? "Go to Dashboard" : "Create your first trip"}
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-white via-indigo-200 to-white opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </Button>
          </Link>
        </motion.div>

        <div className="flex flex-col md:flex-row items-center justify-between pt-10 border-t border-border text-sm text-muted-foreground gap-4 dark:border-white/10 dark:text-white/40">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <Logo variant="sm" className="h-5 w-auto opacity-80" />
            <span>© {new Date().getFullYear()}</span>
          </div>
          <div className="flex gap-6">
            <a href="https://github.com/dimitarpst/gotrippin" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded dark:hover:text-white dark:focus-visible:ring-white/30">GitHub</a>
            <Link href="#" className="hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded dark:hover:text-white dark:focus-visible:ring-white/30">Privacy</Link>
            <Link href="#" className="hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded dark:hover:text-white dark:focus-visible:ring-white/30">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
