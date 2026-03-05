"use client"

import { motion, useScroll, useTransform } from "framer-motion"
import { ArrowRight, MapPin, Sparkles, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useRef } from "react"

export default function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  })

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"])
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0])

  return (
    <section ref={containerRef} className="relative min-h-[100svh] flex flex-col items-center justify-center pt-32 pb-40 overflow-hidden">
      {/* Aurora Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#ff6b6b]/20 rounded-full blur-[120px] mix-blend-screen animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[30rem] h-[30rem] bg-indigo-500/10 rounded-full blur-[120px] mix-blend-screen" style={{ animationDelay: "2s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-4xl bg-gradient-to-b from-transparent via-[var(--color-background)] to-[var(--color-background)]" />
      </div>

      <motion.div 
        className="relative z-10 w-full max-w-5xl mx-auto px-6 flex flex-col items-center text-center"
        style={{ y, opacity }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-[#ff6b6b] mb-8"
        >
          <Sparkles className="w-4 h-4" />
          <span>AI-Powered Travel Planning</span>
        </motion.div>

        <motion.h1 
          className="font-display text-5xl sm:text-7xl lg:text-8xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-white/70 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          Your journeys,<br className="hidden sm:block" /> organized and beautiful.
        </motion.h1>

        <motion.p 
          className="max-w-2xl text-lg sm:text-xl text-muted-foreground mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          Say goodbye to messy spreadsheets. Build itineraries, share with friends, and let AI discover hidden gems along your route.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col sm:flex-row items-center gap-4"
        >
          <Link href="/auth">
            <Button size="lg" className="rounded-full px-8 h-14 text-base font-semibold bg-[#ff6b6b] hover:bg-[#ff8585] text-white shadow-[0_0_40px_-10px_#ff6b6b]">
              Start Planning Free
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
          <Button size="lg" variant="ghost" className="rounded-full px-8 h-14 text-base text-white/70 hover:text-white hover:bg-white/5">
            See how it works
          </Button>
        </motion.div>
      </motion.div>

      {/* Floating UI Mockup */}
      <motion.div 
        className="relative z-20 w-full max-w-5xl mx-auto mt-32 px-6 perspective-[2000px]"
        initial={{ opacity: 0, y: 100, rotateX: 20 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ duration: 1.2, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Glow behind the mockup */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[110%] h-[110%] bg-gradient-to-r from-[#ff6b6b]/10 via-indigo-500/10 to-purple-500/10 blur-[80px] -z-10 rounded-[4rem]" />
        
        <div className="relative rounded-3xl overflow-hidden border border-white/[0.08] bg-black/40 backdrop-blur-3xl shadow-2xl shadow-black/80 h-[600px] md:h-auto md:aspect-video md:max-h-[600px] ring-1 ring-white/5">
          {/* Subtle top edge highlight */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent z-20" />
          
          {/* Mockup Header */}
          <div className="absolute top-0 left-0 right-0 h-16 bg-white/[0.02] border-b border-white/[0.05] flex items-center px-4 sm:px-6 gap-4 z-10">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-white/10" />
              <div className="w-3 h-3 rounded-full bg-white/10" />
              <div className="w-3 h-3 rounded-full bg-white/10" />
            </div>
            <div className="h-8 flex-1 max-w-md bg-black/40 rounded-lg border border-white/[0.05] flex items-center px-4 overflow-hidden shadow-inner">
              <span className="text-xs text-white/30 font-mono truncate tracking-wider">gotrippin.app/trips/KyoT0o9x</span>
            </div>
          </div>

          {/* Mockup Content */}
          <div className="absolute inset-0 pt-16 grid grid-cols-1 grid-rows-[1fr_1.2fr] md:grid-rows-1 md:grid-cols-[1fr_350px] lg:grid-cols-[1fr_400px]">
            {/* Map Area */}
            <div className="relative w-full h-full bg-black/20 flex items-center justify-center overflow-hidden">
              <img src="https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=2070" alt="Kyoto Map Aesthetic" className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-luminosity grayscale" />
              
              {/* Route line simulation */}
              <svg className="absolute inset-0 w-full h-full opacity-40 mix-blend-screen" preserveAspectRatio="none" viewBox="0 0 100 100">
                <path d="M 20,80 Q 40,60 60,70 T 80,30" fill="none" stroke="url(#route-grad)" strokeWidth="0.5" strokeDasharray="2 2" />
                <defs>
                  <linearGradient id="route-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#ff6b6b" />
                    <stop offset="100%" stopColor="#6366f1" />
                  </linearGradient>
                </defs>
              </svg>

              <motion.div 
                className="absolute w-12 h-12 rounded-full bg-black/40 border border-white/10 flex items-center justify-center backdrop-blur-md shadow-xl"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-[#ff6b6b] to-orange-400 shadow-[0_0_20px_#ff6b6b]" />
              </motion.div>
            </div>

            {/* Sidebar Area */}
            <div className="relative w-full h-full border-t md:border-t-0 md:border-l border-white/[0.05] bg-white/[0.01] backdrop-blur-xl p-4 sm:p-6 flex flex-col gap-3 sm:gap-4 overflow-hidden shadow-[-20px_0_40px_rgba(0,0,0,0.3)]">
              <div className="h-24 sm:h-40 shrink-0 rounded-2xl overflow-hidden relative mb-2 sm:mb-4 ring-1 ring-white/10">
                <img src="https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=2070" className="w-full h-full object-cover" alt="Cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex items-end p-5">
                  <h3 className="font-display text-2xl font-bold text-white tracking-tight">Kyoto Summer</h3>
                </div>
              </div>

              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white/[0.02] rounded-xl p-4 border border-white/[0.05] flex gap-4 items-center hover:bg-white/[0.04] transition-colors cursor-default group">
                  <div className="w-10 h-10 rounded-lg bg-black/40 border border-white/5 flex items-center justify-center shrink-0 group-hover:border-white/10 transition-colors">
                    <Calendar className="w-4 h-4 text-white/40 group-hover:text-[#ff6b6b] transition-colors" />
                  </div>
                  <div className="flex-1">
                    <div className="h-3 w-24 bg-white/10 rounded mb-2" />
                    <div className="h-2 w-16 bg-white/5 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  )
}
