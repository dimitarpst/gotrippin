"use client"

import { useRouter } from "next/navigation"
import { useEffect, use, useState } from "react"
import AuroraBackground from "@/components/effects/aurora-background"
import PageLoader from "@/components/ui/page-loader"
import PageError from "@/components/ui/page-error"
import CreateTrip from "@/components/trips/create-trip"
import { toast } from "sonner"
import { useTrip } from "@/hooks/useTrips"
import { updateTripAction } from "@/actions/trips"
import { useAuth } from "@/contexts/AuthContext"
import type { DateRange } from "react-day-picker"
import { useTranslation } from "react-i18next"
import type { RouteLocation } from "@/components/trips/route/route-builder"

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
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSave = async (data: { 
    title: string; 
    coverPhoto?: import("@gotrippin/core").CoverPhotoInput;
    color?: string; 
    dateRange?: DateRange;
    locations?: RouteLocation[];
  }) => {
    try {
      const tripData: any = {}
      
      if (data.title !== trip?.title) tripData.title = data.title
      if (data.coverPhoto) tripData.cover_photo = data.coverPhoto
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
      
      const result = await updateTripAction(trip.id, tripData)

      if (result.success) {
        toast.success(t("trips.update_success", { defaultValue: "Trip updated successfully!" }))
        router.push(`/trips/${shareCode}`)
      } else {
        toast.error(t("trips.update_failed", { defaultValue: "Failed to update trip" }), {
          description: result.error
        })
      }
    } catch (error) {
      toast.error(t("common.error_occurred", { defaultValue: "An error occurred" }), {
        description: error instanceof Error ? error.message : String(error)
      })
    }
  }

  const handleBack = () => {
    router.push(`/trips/${shareCode}`)
  }

  if (!mounted || authLoading || tripLoading) {
    return <PageLoader message={mounted ? t("trips.loading") : undefined} />
  }

  if (!user) {
    return <PageLoader message={t("trips.redirecting")} />
  }

  if (!trip) {
    return (
      <PageError
        title={t("trips.trip_not_found")}
        message={t("trips.trip_not_found_description", { defaultValue: "We couldn't find the trip you're looking for." })}
        onRetry={() => router.push("/")}
      />
    )
  }

  const initialData = {
    title: trip.title || '',
    initialCoverPhoto: (trip as any).cover_photo ?? null,
    color: trip.color ?? undefined,
    dateRange: (trip.start_date && trip.end_date) ? {
      from: new Date(trip.start_date),
      to: new Date(trip.end_date)
    } : undefined,
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

