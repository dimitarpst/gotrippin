"use client"

import { motion } from "framer-motion"
import { X } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

interface TripOverviewSkeletonProps {
  onBack?: () => void
}

export default function TripOverviewSkeleton({ onBack }: TripOverviewSkeletonProps) {
  return (
    <div className="min-h-screen relative bg-[var(--color-background)]">
      {/* Hero Section Skeleton */}
      <Skeleton className="relative w-full h-[50vh] bg-gradient-to-br from-[#ff6b6b]/20 to-[#4ecdc4]/20 rounded-none">
        <div className="absolute inset-x-0 bottom-0 h-32 pointer-events-none bg-gradient-to-b from-transparent to-[var(--color-background)]" />
      </Skeleton>

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
            <Skeleton className="w-12 h-12 rounded-full bg-white/5" />
            <Skeleton className="w-12 h-12 rounded-full bg-white/5" />
          </div>

          <div className="flex gap-3">
            <Skeleton className="w-12 h-12 rounded-full bg-white/5" />
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
          <Skeleton className="h-12 w-3/4 mx-auto bg-white/10 rounded-lg" />
          <Skeleton className="h-4 w-1/2 mx-auto bg-white/5 rounded-lg" />
          <Skeleton className="h-4 w-1/3 mx-auto bg-white/5 rounded-lg" />
        </div>

        {/* Plus Button Skeleton */}
        <div className="relative z-10 flex justify-center pt-8 pb-12">
          <Skeleton className="w-16 h-16 rounded-full bg-[#ff6b6b]/30" />
        </div>

        {/* Cards Skeleton */}
        <div className="relative z-10 px-6 pb-8 space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton
              key={i}
              className="border border-white/[0.08] rounded-2xl p-5 bg-[#0e0b10]/50 h-32"
              style={{
                animationDelay: `${i * 150}ms`,
              }}
            >
              <div className="flex items-center gap-3 mb-3">
                <Skeleton className="w-10 h-10 rounded-xl bg-white/10" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-24 bg-white/10 rounded" />
                  <Skeleton className="h-3 w-16 bg-white/10 rounded" />
                </div>
              </div>
              <div className="space-y-2">
                <Skeleton className="h-3 w-full bg-white/10 rounded" />
                <Skeleton className="h-3 w-3/4 bg-white/10 rounded" />
              </div>
            </Skeleton>
          ))}
        </div>
      </div>
    </div>
  )
}

