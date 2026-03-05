"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { Compass } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function LandingNav() {
  return (
    <motion.nav 
      className="fixed top-0 left-0 right-0 z-50 px-6 py-6 sm:px-12 flex items-center justify-between pointer-events-none"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      <Link href="/home" className="flex items-center gap-2 pointer-events-auto group cursor-pointer">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#ff6b6b] to-[#ff8e8b] flex items-center justify-center shadow-lg shadow-[#ff6b6b]/20 group-hover:scale-105 transition-transform duration-300">
          <Compass className="w-6 h-6 text-white" />
        </div>
        <span className="font-display font-bold text-xl tracking-tight">
          Go Trippin'
        </span>
      </Link>

      <div className="pointer-events-auto">
        <Link href="/auth">
          <Button 
            className="rounded-full px-6 bg-white/5 hover:bg-white/10 text-white border border-white/10 backdrop-blur-md transition-all duration-300 hover:scale-105"
            variant="outline"
          >
            Get Started
          </Button>
        </Link>
      </div>
    </motion.nav>
  )
}
