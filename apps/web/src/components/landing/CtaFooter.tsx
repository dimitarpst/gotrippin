"use client"

import { motion } from "framer-motion"
import { ArrowRight, Compass } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

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
          <div className="w-16 h-16 mx-auto bg-gradient-to-tr from-[#ff6b6b] to-[#ff8e8b] rounded-2xl flex items-center justify-center mb-8 shadow-2xl shadow-[#ff6b6b]/20">
            <Compass className="w-8 h-8 text-white" />
          </div>
          
          <h2 className="font-display text-5xl sm:text-6xl font-bold tracking-tight mb-6">
            Ready to get out there?
          </h2>
          <p className="text-xl text-muted-foreground mb-10">
            Join thousands of travelers planning better trips in less time.
          </p>
          
          <Link href="/auth">
            <Button size="lg" className="rounded-full px-10 h-16 text-lg font-semibold bg-white text-black hover:bg-white/90 shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] hover:scale-105 transition-all duration-300">
              Create your first trip
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </motion.div>

        <div className="flex flex-col md:flex-row items-center justify-between pt-10 border-t border-white/10 text-sm text-white/40">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <Compass className="w-4 h-4" />
            <span className="font-display font-bold">Go Trippin'</span>
            <span>© {new Date().getFullYear()}</span>
          </div>
          <div className="flex gap-6">
            <a href="https://github.com/dimitarpst/gotrippin" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">GitHub</a>
            <Link href="#" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-white transition-colors">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
