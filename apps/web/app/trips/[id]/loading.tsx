"use client"

import AuroraBackground from "@/components/effects/aurora-background"
import TripOverviewSkeleton from "@/components/trips/trip-overview-skeleton"

export default function TripDetailLoading() {
  return (
    <main className="relative min-h-screen flex flex-col bg-[var(--color-background)] text-[var(--color-foreground)] overflow-hidden">
      <AuroraBackground />

      <div className="flex-1 relative z-10">
        <TripOverviewSkeleton />
      </div>
    </main>
  )
}

