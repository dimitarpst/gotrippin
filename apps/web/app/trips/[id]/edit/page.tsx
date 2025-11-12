"use client"

import { useRouter } from "next/navigation"
import { useEffect, use, useState } from "react"
import AuroraBackground from "@/components/effects/aurora-background"
import CreateTrip from "@/components/trips/create-trip"
import { useUpdateTrip, useTrip } from "@/hooks/useTrips"
import { useAuth } from "@/contexts/AuthContext"
import type { DateRange } from "react-day-picker"

interface EditTripPageProps {
  params: Promise<{
    id: string
  }>
}

export default function EditTripPage({ params }: EditTripPageProps) {
  const router = useRouter()
  const resolvedParams = use(params)
  const tripId = resolvedParams.id
  const { user, loading: authLoading } = useAuth()
  const { trip, loading: tripLoading } = useTrip(tripId)
  const { update, updating } = useUpdateTrip()

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
      }
      if (data.dateRange?.to) {
        const newEndDate = data.dateRange.to.toISOString()
        if (newEndDate !== trip?.end_date) {
          tripData.end_date = newEndDate
        }
      }
      
      console.log("Updating trip with data:", tripData)
      
      const updatedTrip = await update(tripId, tripData)

      console.log("Updated trip:", updatedTrip)

      if (updatedTrip) {
        router.push(`/trips/${tripId}`)
      }
    } catch (error) {
      console.error("Failed to update trip:", error)
    }
  }

  const handleBack = () => {
    router.push(`/trips/${tripId}`)
  }

  if (authLoading || tripLoading) {
    return (
      <main className="relative min-h-screen flex flex-col bg-[var(--color-background)] text-[var(--color-foreground)] overflow-hidden">
        <AuroraBackground />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-[#ff6b6b] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white text-lg">Loading...</p>
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
            <p className="text-white">Redirecting to login...</p>
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
            <p className="text-white text-lg">Trip not found</p>
            <button
              onClick={() => router.push('/')}
              className="mt-4 px-6 py-2 rounded-full font-semibold"
              style={{ background: "#ff6b6b", color: "white" }}
            >
              Go Home
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

