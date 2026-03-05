"use client"

import { motion } from "framer-motion"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Logo } from "@/components/Logo"

export default function CtaFooter() {
  return (
    <footer className="relative pt-32 pb-10 overflow-hidden border-t border-white/5">
      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[500px] bg-[#ff6b6b]/10 blur-[150px] pointer-events-none rounded-full" />

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

          <h2 className="font-display text-5xl sm:text-6xl font-bold tracking-tight mb-6">
            Ready to sequence your next adventure?
          </h2>
          <p className="text-xl text-muted-foreground mb-10">
            {"Join travelers building better itineraries with gotrippin."}
          </p>

          <Link href="/auth">
            <Button size="lg" className="relative group overflow-hidden rounded-full px-10 h-16 text-lg font-semibold bg-white text-black hover:scale-105 transition-all duration-300 shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]">
              <span className="relative z-10 flex items-center">
                Create your first trip
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-white via-indigo-200 to-white opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </Button>
          </Link>
        </motion.div>

        <div className="flex flex-col md:flex-row items-center justify-between pt-10 border-t border-white/10 text-sm text-white/40 gap-4">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <Logo variant="sm" className="h-5 w-auto opacity-80" />
            <span>© {new Date().getFullYear()}</span>
          </div>
          <div className="flex gap-6">
            <a href="https://github.com/dimitarpst/gotrippin" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)] rounded">GitHub</a>
            <Link href="#" className="hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)] rounded">Privacy</Link>
            <Link href="#" className="hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)] rounded">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
