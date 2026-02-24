"use client"

import { useRouter } from "next/navigation"
import AuroraBackground from "@/components/effects/aurora-background"
import TrainRouteForm from "@/components/trips/train-route-form"
import type { Trip } from "@gotrippin/core"

interface RoutePageClientProps {
  trip: Trip
  shareCode: string
}

export default function RoutePageClient({ trip, shareCode }: RoutePageClientProps) {
  const router = useRouter()

  const handleBack = () => {
    router.push(`/trips/${shareCode}/activity`)
  }

  return (
    <main className="relative min-h-screen flex flex-col bg-[var(--color-background)] text-[var(--color-foreground)] overflow-hidden">
      <AuroraBackground />
      <div className="flex-1 relative z-10">
        <TrainRouteForm tripId={trip.id} onBack={handleBack} />
      </div>
    </main>
  )
}
