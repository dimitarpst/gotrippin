"use client"

import { motion } from "framer-motion"
import { X } from "lucide-react"

interface TripOverviewSkeletonProps {
  onBack?: () => void
}

export default function TripOverviewSkeleton({ onBack }: TripOverviewSkeletonProps) {
  return (
    <div className="min-h-screen relative bg-[var(--color-background)]">
      {/* Hero Section Skeleton */}
      <div className="relative w-full h-[50vh] bg-gradient-to-br from-[#ff6b6b]/20 to-[#4ecdc4]/20 animate-pulse">
        <div className="absolute inset-x-0 bottom-0 h-32 pointer-events-none bg-gradient-to-b from-transparent to-[var(--color-background)]" />
      </div>

      <div
        className="absolute inset-0 overflow-y-auto scrollbar-hide"
        style={{
          background: `linear-gradient(to bottom,
            transparent 0%,
            transparent 30%,
            var(--color-background) 50%,
            var(--color-background) 100%)`,
        }}
      >
        {/* Header Buttons */}
        <div className="relative z-10 px-6 pt-8 flex items-center justify-between">
          <div className="flex gap-3">
            <div className="w-12 h-12 rounded-full bg-white/5 animate-pulse" />
            <div className="w-12 h-12 rounded-full bg-white/5 animate-pulse" />
          </div>

          <div className="flex gap-3">
            <div className="w-12 h-12 rounded-full bg-white/5 animate-pulse" />
            {onBack && (
              <motion.button
                onClick={onBack}
                className="w-12 h-12 rounded-full backdrop-blur-md border border-white/20 flex items-center justify-center"
                style={{ background: "rgba(0,0,0,0.3)" }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <X className="w-5 h-5 text-white" />
              </motion.button>
            )}
          </div>
        </div>

        {/* Title Section Skeleton */}
        <div className="relative z-10 px-6 pt-20 text-center space-y-4">
          <div className="h-12 w-3/4 mx-auto bg-white/10 rounded-lg animate-pulse" />
          <div className="h-4 w-1/2 mx-auto bg-white/5 rounded-lg animate-pulse" />
          <div className="h-4 w-1/3 mx-auto bg-white/5 rounded-lg animate-pulse" />
        </div>

        {/* Plus Button Skeleton */}
        <div className="relative z-10 flex justify-center pt-8 pb-12">
          <div className="w-16 h-16 rounded-full bg-[#ff6b6b]/30 animate-pulse" />
        </div>

        {/* Cards Skeleton */}
        <div className="relative z-10 px-6 pb-8 space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="border border-white/[0.08] rounded-2xl p-5 bg-[#0e0b10]/50 animate-pulse"
              style={{
                animationDelay: `${i * 150}ms`,
              }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-white/5" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-24 bg-white/5 rounded" />
                  <div className="h-3 w-16 bg-white/5 rounded" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3 w-full bg-white/5 rounded" />
                <div className="h-3 w-3/4 bg-white/5 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

