"use client"

import { useRouter } from "next/navigation"
import { use } from "react"
import AuroraBackground from "@/components/effects/aurora-background"
import TrainRouteForm from "@/components/trips/train-route-form"
import { useTrip } from "@/hooks/useTrips"

interface TrainRoutePageProps {
  params: Promise<{
    id: string
  }>
}

export default function TrainRoutePage({ params }: TrainRoutePageProps) {
  const router = useRouter()
  const resolvedParams = use(params)
  const shareCode = resolvedParams.id
  const { trip, loading } = useTrip(shareCode)
  const tripId = trip?.id

  const handleBack = () => {
    router.push(`/trips/${shareCode}/activity`)
  }

  return (
    <main className="relative min-h-screen flex flex-col bg-[var(--color-background)] text-[var(--color-foreground)] overflow-hidden">
      <AuroraBackground />
      <div className="flex-1 relative z-10">
        <TrainRouteForm tripId={tripId ?? ""} onBack={handleBack} />
        {loading && !tripId && (
          <div className="absolute inset-0 flex items-center justify-center text-white/70 text-sm">Loading trip…</div>
        )}
      </div>
    </main>
  )
}

