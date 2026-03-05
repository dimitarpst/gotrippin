"use client"

import { motion } from "framer-motion"
import { Map, Users, Sparkles, Image as ImageIcon } from "lucide-react"

const features = [
  {
    title: "Interactive Route Map",
    description: "Visualize your entire journey on a dynamic map. Drag and drop to reorder stops and see travel times instantly.",
    icon: Map,
    className: "md:col-span-2 md:row-span-2 bg-gradient-to-br from-white/[0.03] to-transparent ring-1 ring-white/5",
    illustration: (
      <div className="absolute right-8 bottom-8 left-8 top-8 flex items-center justify-end md:justify-center">
        <svg className="w-full max-w-sm h-auto opacity-20" viewBox="0 0 200 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M 30 90 L 70 60 L 110 75 L 170 30" stroke="url(#route)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="30" cy="90" r="4" fill="#ff6b6b" className="drop-shadow-[0_0_8px_#ff6b6b]" />
          <circle cx="70" cy="60" r="3" fill="white" fillOpacity="0.6" />
          <circle cx="110" cy="75" r="3" fill="white" fillOpacity="0.6" />
          <circle cx="170" cy="30" r="4" fill="#ff6b6b" className="drop-shadow-[0_0_8px_#ff6b6b]" />
          <defs>
            <linearGradient id="route" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ff6b6b" />
              <stop offset="100%" stopColor="#6366f1" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    )
  },
  {
    title: "AI Trip Assistant",
    description: "Ask for hidden gems, local foods, or optimal routes. Our AI knows the world.",
    icon: Sparkles,
    className: "md:col-span-1 md:row-span-1 bg-gradient-to-br from-indigo-500/10 to-transparent ring-1 ring-white/5",
    illustration: (
      <div className="absolute right-6 top-6 w-16 h-16 rounded-2xl bg-indigo-500/10 border border-white/5 flex items-center justify-center">
        <Sparkles className="w-7 h-7 text-indigo-400/80" />
      </div>
    )
  },
  {
    title: "Shared Itineraries",
    description: "Invite friends to collaborate in real-time. Everyone stays on the same page.",
    icon: Users,
    className: "md:col-span-1 md:row-span-1 bg-gradient-to-br from-[#ff6b6b]/10 to-transparent ring-1 ring-white/5",
    illustration: (
      <div className="absolute -right-4 -bottom-4 flex -space-x-3 p-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="relative w-14 h-14 rounded-full border-2 border-black bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md flex items-center justify-center shadow-xl z-10" style={{ zIndex: 10 - i }}>
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#ff6b6b]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <Users className="w-5 h-5 text-white/50" />
          </div>
        ))}
      </div>
    )
  }
]

export default function BentoFeatures() {
  return (
    <section className="py-32 px-6 max-w-7xl mx-auto relative z-10">
      {/* Background ambient glow for the section */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl h-[600px] bg-indigo-500/5 blur-[120px] pointer-events-none -z-10 rounded-full" />
      <div className="text-center mb-20">
        <motion.h2 
          className="font-display text-4xl sm:text-5xl font-bold tracking-tight mb-6"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
        >
          Everything you need.<br/>Nothing you don't.
        </motion.h2>
        <motion.p 
          className="text-lg text-muted-foreground max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ delay: 0.1 }}
        >
          Built for travelers who want powerful tools wrapped in a minimal, distraction-free interface.
        </motion.p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[250px]">
        {features.map((feature, i) => (
          <motion.div
            key={i}
            className={`relative rounded-3xl border border-white/10 overflow-hidden group hover:border-white/20 transition-colors ${feature.className}`}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: i * 0.1, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/[0.02] transition-colors duration-500" />
            
            <div className="relative z-10 p-8 h-full flex flex-col">
              <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center mb-6 backdrop-blur-md">
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-display text-2xl font-bold text-white mb-3">{feature.title}</h3>
              <p className="text-white/60 max-w-sm leading-relaxed">{feature.description}</p>
            </div>

            {feature.illustration}
          </motion.div>
        ))}
      </div>
    </section>
  )
}
