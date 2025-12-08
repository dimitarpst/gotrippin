"use client"

import { useRouter } from "next/navigation"
import { use } from "react"
import AuroraBackground from "@/components/effects/aurora-background"
import ActivitySelector from "@/components/trips/activity-selector"
import { useTrip } from "@/hooks/useTrips"

interface ActivityPageProps {
  params: Promise<{
    id: string
  }>
}

export default function ActivityPage({ params }: ActivityPageProps) {
  const router = useRouter()
  const resolvedParams = use(params)
  const shareCode = resolvedParams.id
  const { trip, loading } = useTrip(shareCode)
  const tripId = trip?.id

  const handleBack = () => {
    router.push(`/trips/${shareCode}`)
  }

  return (
    <main className="relative min-h-screen flex flex-col bg-[var(--color-background)] text-[var(--color-foreground)] overflow-hidden">
      <AuroraBackground />
      <div className="flex-1 relative z-10">
        <ActivitySelector tripId={tripId ?? ""} shareCode={shareCode} onBack={handleBack} />
        {loading && !tripId && (
          <div className="absolute inset-0 flex items-center justify-center text-white/70 text-sm">Loading trip…</div>
        )}
      </div>
    </main>
  )
}

