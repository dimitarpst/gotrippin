"use client"

import { useRouter } from "next/navigation"
import AuroraBackground from "@/components/effects/aurora-background"
import CreateTrip from "@/components/trips/create-trip"
import { useTrips } from "@/hooks/useTrips"
import { createTripAction } from "@/actions/trips"
import { useAuth } from "@/contexts/AuthContext"
import { useState, useEffect } from "react"
import type { DateRange } from "react-day-picker"
import { useTranslation } from "react-i18next"
import { addLocation } from "@/lib/api/trip-locations"
import type { RouteLocation } from "@/components/trips/route/route-builder"

export default function CreateTripPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const { user, loading: authLoading, accessToken } = useAuth()
  const { refetch } = useTrips()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSave = async (data: { 
    title: string; 
    imageUrl?: string; 
    color?: string; 
    dateRange?: DateRange;
    locations?: RouteLocation[];
  }) => {
    try {
      // Build trip data, filtering out undefined values
      const tripData: any = {
        title: data.title,
      }
      
      if (data.imageUrl) tripData.image_url = data.imageUrl
      if (data.color) tripData.color = data.color
      if (data.dateRange?.from) tripData.start_date = data.dateRange.from.toISOString()
      if (data.dateRange?.to) tripData.end_date = data.dateRange.to.toISOString()
      
      const result = await createTripAction(tripData)

      if (!result.success) {
        console.error("Failed to create trip:", result.error)
        return
      }

      const newTrip = result.data

      if (newTrip.id && data.locations && data.locations.length > 0) {
        // Add locations (best-effort, don't block trip creation on failure)
        console.log("Adding locations:", data.locations)
        
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
          // Continue without blocking the main trip creation flow
        }
      }

      if (newTrip) {
        await refetch()
        // Use share code for navigation if available
        if (newTrip.share_code) {
          router.push(`/trips/${newTrip.share_code}`)
        } else {
          router.push('/')
        }
      }
    } catch (error) {
      console.error("Failed to create trip:", error)
    }
  }

  const handleBack = () => {
    router.push('/')
  }

  if (!mounted || authLoading) {
    return (
      <main className="relative min-h-screen flex flex-col bg-[var(--color-background)] text-[var(--color-foreground)] overflow-hidden">
        <AuroraBackground />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-[#ff6b6b] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            {mounted && <p className="text-white text-lg">{t('trips.loading')}</p>}
          </div>
        </div>
      </main>
    )
  }

  if (!user) {
    return (
      <main className="relative min-h-screen flex flex-col bg-[var(--color-background)] text-[var(--color-foreground)] overflow-hidden">
        <AuroraBackground />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-white">{t('trips.redirecting')}</p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="relative min-h-screen flex flex-col bg-[var(--color-background)] text-[var(--color-foreground)] overflow-hidden">
      <AuroraBackground />

      <div className="flex-1 relative z-10">
        <CreateTrip
          onBack={handleBack}
          onSave={handleSave}
        />
      </div>
    </main>
  )
}
