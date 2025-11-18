"use client"

import { useRouter } from "next/navigation"
import { use } from "react"
import AuroraBackground from "@/components/effects/aurora-background"
import FlightEditor from "@/components/trips/flight-editor"

interface FlightDetailsPageProps {
  params: Promise<{
    id: string
    flightId: string
  }>
}

export default function FlightDetailsPage({ params }: FlightDetailsPageProps) {
  const router = useRouter()
  const resolvedParams = use(params)
  const tripId = resolvedParams.id
  const flightId = resolvedParams.flightId

  const handleBack = () => {
    router.push(`/trips/${tripId}/activity/flight`)
  }

  return (
    <main className="relative min-h-screen flex flex-col bg-[var(--color-background)] text-[var(--color-foreground)] overflow-hidden">
      <AuroraBackground />
      <div className="flex-1 relative z-10">
        <FlightEditor tripId={tripId} flightId={flightId} onBack={handleBack} />
      </div>
    </main>
  )
}

