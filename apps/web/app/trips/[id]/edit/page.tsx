"use client"

import { useRouter } from "next/navigation"
import { useEffect, use, useState } from "react"
import AuroraBackground from "@/components/effects/aurora-background"
import CreateTrip from "@/components/trips/create-trip"
import { useUpdateTrip, useTrip } from "@/hooks/useTrips"
import { useAuth } from "@/contexts/AuthContext"
import type { DateRange } from "react-day-picker"
import { useTranslation } from "react-i18next"

interface EditTripPageProps {
  params: Promise<{
    id: string
  }>
}

export default function EditTripPage({ params }: EditTripPageProps) {
  const { t } = useTranslation()
  const router = useRouter()
  const resolvedParams = use(params)
  const shareCode = resolvedParams.id // Route param is share code, not UUID
  const { user, loading: authLoading } = useAuth()
  const { trip, loading: tripLoading } = useTrip(shareCode)
  const { update } = useUpdateTrip()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth')
    }
  }, [authLoading, user, router])

  const handleSave = async (data: { title: string; imageUrl?: string; color?: string; dateRange?: DateRange }) => {
    try {
      // Build trip data, filtering out undefined values
      const tripData: any = {}
      
      if (data.title !== trip?.title) tripData.title = data.title
      if (data.imageUrl !== trip?.image_url) tripData.image_url = data.imageUrl
      if (data.color !== trip?.color) tripData.color = data.color
      
      // Handle dates
      if (data.dateRange?.from) {
        const newStartDate = data.dateRange.from.toISOString()
        if (newStartDate !== trip?.start_date) {
          tripData.start_date = newStartDate
        }
      } else if (trip?.start_date) {
        // User cleared the start date, send null to clear it
        tripData.start_date = null
      }
      
      if (data.dateRange?.to) {
        const newEndDate = data.dateRange.to.toISOString()
        if (newEndDate !== trip?.end_date) {
          tripData.end_date = newEndDate
        }
      } else if (trip?.end_date) {
        // User cleared the end date, send null to clear it
        tripData.end_date = null
      }
      
      console.log("Updating trip with data:", tripData)
      
      // Update uses trip ID (UUID), not share code
      if (!trip?.id) {
        console.error("Cannot update: trip ID not available")
        return
      }
      
      const updatedTrip = await update(trip.id, tripData)

      console.log("Updated trip:", updatedTrip)

      if (updatedTrip) {
        router.push(`/trips/${shareCode}`)
      }
    } catch (error) {
      console.error("Failed to update trip:", error)
    }
  }

  const handleBack = () => {
    router.push(`/trips/${shareCode}`)
  }

  if (!mounted || authLoading || tripLoading) {
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

  if (!trip) {
    return (
      <main className="relative min-h-screen flex flex-col bg-[var(--color-background)] text-[var(--color-foreground)] overflow-hidden">
        <AuroraBackground />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-white text-lg">{t('trips.trip_not_found')}</p>
            <button
              onClick={() => router.push('/')}
              className="mt-4 px-6 py-2 rounded-full font-semibold"
              style={{ background: "#ff6b6b", color: "white" }}
            >
              {t('trips.go_home')}
            </button>
          </div>
        </div>
      </main>
    )
  }

  // Prepare initial data from the trip
  const initialData = {
    title: trip.title || '',
    imageUrl: trip.image_url,
    color: trip.color,
    dateRange: (trip.start_date && trip.end_date) ? {
      from: new Date(trip.start_date),
      to: new Date(trip.end_date)
    } : undefined
  }

  return (
    <main className="relative min-h-screen flex flex-col bg-[var(--color-background)] text-[var(--color-foreground)] overflow-hidden">
      <AuroraBackground />

      <div className="flex-1 relative z-10">
        <CreateTrip
          onBack={handleBack}
          onSave={handleSave}
          initialData={initialData}
          isEditing={true}
        />
      </div>
    </main>
  )
}

