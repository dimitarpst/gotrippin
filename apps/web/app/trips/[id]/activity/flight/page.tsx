"use client"

import { useRouter, useParams } from "next/navigation"
import { use } from "react"
import AuroraBackground from "@/components/effects/aurora-background"
import FlightSearch from "@/components/trips/flight-search"

interface FlightSearchPageProps {
  params: Promise<{
    id: string
  }>
}

export default function FlightSearchPage({ params }: FlightSearchPageProps) {
  const router = useRouter()
  const resolvedParams = use(params)
  const tripId = resolvedParams.id

  const handleBack = () => {
    router.push(`/trips/${tripId}/activity`)
  }

  return (
    <main className="relative min-h-screen flex flex-col bg-[var(--color-background)] text-[var(--color-foreground)] overflow-hidden">
      <AuroraBackground />
      <div className="flex-1 relative z-10">
        <FlightSearch tripId={tripId} onBack={handleBack} />
      </div>
    </main>
  )
}

