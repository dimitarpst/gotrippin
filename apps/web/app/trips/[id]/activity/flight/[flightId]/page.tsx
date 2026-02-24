"use client"

import { useRouter } from "next/navigation"
import { use, useEffect, useState } from "react"
import { toast } from "sonner"
import AuroraBackground from "@/components/effects/aurora-background"
import FlightEditor from "@/components/trips/flight-editor"
import { useTrip } from "@/hooks/useTrips"
import { useTripLocations } from "@/hooks/useTripLocations"
import { useAuth } from "@/contexts/AuthContext"
import { createActivity, updateActivity } from "@/lib/api/activities"
import { ApiError } from "@/lib/api/trips"
import { Card } from "@/components/ui/card"

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

interface FlightDetailsPageProps {
  params: Promise<{
    id: string
    flightId: string
  }>
}

export default function FlightDetailsPage({ params }: FlightDetailsPageProps) {
  const router = useRouter()
  const resolvedParams = use(params)
  const shareCode = resolvedParams.id
  const flightId = resolvedParams.flightId
  const { trip, loading } = useTrip(shareCode)
  const { locations } = useTripLocations(trip?.id)
  const { accessToken } = useAuth()
  const tripId = trip?.id

  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null)

  useEffect(() => {
    if (selectedLocationId === null && locations.length > 0) {
      setSelectedLocationId(locations[0].id)
    }
  }, [locations, selectedLocationId])

  const handleBack = () => {
    router.push(`/trips/${shareCode}/activity/flight`)
  }

  const handleSave = async () => {
    if (!tripId || !accessToken) {
      toast.error("Authentication required")
      return
    }

    const isNewFlight = !flightId || flightId === "flight-1" || !UUID_REGEX.test(flightId)

    try {
      if (isNewFlight) {
        if (locations.length > 0 && !selectedLocationId) {
          toast.error("Select a stop for this flight")
          return
        }
        await createActivity(
          tripId,
          {
            type: "flight",
            title: "Flight",
            location_id: selectedLocationId ?? null,
            notes: null,
            start_time: null,
            end_time: null,
            all_day: false,
          },
          accessToken
        )
      } else {
        await updateActivity(
          tripId,
          flightId,
          {
            title: "Flight",
            type: "flight",
            location_id: selectedLocationId ?? undefined,
          },
          accessToken
        )
      }
      toast.success("Flight saved")
      router.refresh()
      router.push(`/trips/${shareCode}/activity/flight`)
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed to save flight"
      toast.error(message)
    }
  }

  return (
    <main className="relative min-h-screen flex flex-col bg-[var(--color-background)] text-[var(--color-foreground)] overflow-hidden">
      <AuroraBackground />
      <div className="flex-1 relative z-10">
        {locations.length > 0 && (
          <div className="px-4 pt-4 pb-2">
            <Card
              className="rounded-2xl p-4 shadow-card border-white/10 space-y-2"
              style={{ backgroundColor: "var(--surface)" }}
            >
              <p className="text-sm font-semibold text-white">Add to stop</p>
              <div className="flex flex-wrap gap-2">
                {locations.map((loc) => (
                  <button
                    key={loc.id}
                    type="button"
                    onClick={() => setSelectedLocationId(loc.id)}
                    className="px-4 py-2 rounded-xl text-sm font-medium transition border"
                    style={{
                      backgroundColor: selectedLocationId === loc.id ? "var(--accent)" : "var(--surface-alt)",
                      color: "white",
                      borderColor: selectedLocationId === loc.id ? "var(--accent)" : "rgba(255,255,255,0.1)",
                    }}
                  >
                    {loc.location_name || "Unnamed stop"}
                  </button>
                ))}
              </div>
            </Card>
          </div>
        )}
        <FlightEditor tripId={tripId ?? ""} flightId={flightId} onBack={handleBack} onSave={handleSave} />
        {loading && !tripId && (
          <div className="absolute inset-0 flex items-center justify-center text-white/70 text-sm">Loading trip…</div>
        )}
      </div>
    </main>
  )
}

