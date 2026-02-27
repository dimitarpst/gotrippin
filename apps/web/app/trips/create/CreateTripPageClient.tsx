"use client"

import { useRouter } from "next/navigation"
import AuroraBackground from "@/components/effects/aurora-background"
import PageLoader from "@/components/ui/page-loader"
import CreateTrip from "@/components/trips/create-trip"
import { toast } from "sonner"
import { useTrips } from "@/hooks/useTrips"
import { createTripAction } from "@/actions/trips"
import { useAuth } from "@/contexts/AuthContext"
import { useState, useEffect } from "react"
import type { DateRange } from "react-day-picker"
import { useTranslation } from "react-i18next"
import { addLocation } from "@/lib/api/trip-locations"
import { getRandomRouteColor } from "@/lib/route-colors"
import type { RouteLocation } from "@/components/trips/route/route-builder"

export default function CreateTripPageClient() {
  const { t } = useTranslation()
  const router = useRouter()
  const { accessToken } = useAuth()
  const { refetch } = useTrips()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSave = async (data: {
    title: string
    coverPhoto?: import("@gotrippin/core").CoverPhotoInput
    color?: string
    dateRange?: DateRange
    locations?: RouteLocation[]
  }) => {
    try {
      const tripData: Record<string, unknown> = {
        title: data.title,
      }

      if (data.coverPhoto) tripData.cover_photo = data.coverPhoto
      tripData.color = data.color ?? getRandomRouteColor()
      if (data.dateRange?.from) tripData.start_date = data.dateRange.from.toISOString()
      if (data.dateRange?.to) tripData.end_date = data.dateRange.to.toISOString()

      const result = await createTripAction(tripData as import("@gotrippin/core").TripCreateData)

      if (!result.success) {
        toast.error(t("trips.create_failed", { defaultValue: "Failed to create trip" }), {
          description: result.error,
        })
        return
      }

      const newTrip = result.data
      toast.success(t("trips.create_success", { defaultValue: "Trip created successfully!" }))

      if (newTrip?.id && data.locations && data.locations.length > 0 && accessToken) {
        try {
          for (let i = 0; i < data.locations.length; i++) {
            const loc = data.locations[i]
            if (!loc.name) continue
            await addLocation(
              newTrip.id,
              {
                location_name: loc.name,
                order_index: i + 1,
                arrival_date: loc.arrivalDate || undefined,
                departure_date: loc.departureDate || undefined,
              },
              accessToken
            )
          }
        } catch (locError) {
          console.error("Failed to add one or more locations:", locError)
        }
      }

      if (newTrip) {
        await refetch()
        if (newTrip.share_code) {
          router.push(`/trips/${newTrip.share_code}`)
        } else {
          router.push("/")
        }
      }
    } catch (error) {
      toast.error(t("common.error_occurred", { defaultValue: "An error occurred" }), {
        description: error instanceof Error ? error.message : String(error),
      })
    }
  }

  const handleBack = () => {
    router.push("/")
  }

  if (!mounted || !accessToken) {
    return <PageLoader message={mounted ? t("trips.loading") : undefined} />
  }

  return (
    <main className="relative min-h-screen flex flex-col bg-[var(--color-background)] text-[var(--color-foreground)] overflow-hidden">
      <AuroraBackground />

      <div className="flex-1 relative z-10">
        <CreateTrip onBack={handleBack} onSave={handleSave} />
      </div>
    </main>
  )
}
