"use client"

import { useRouter } from "next/navigation"
import AuroraBackground from "@/components/effects/aurora-background"
import CreateTrip from "@/components/trips/create-trip"
import { toast } from "sonner"
import { updateTripAction } from "@/actions/trips"
import type { DateRange } from "react-day-picker"
import { useTranslation } from "react-i18next"
import type { RouteLocation } from "@/components/trips/route/route-builder"
import type { Trip } from "@gotrippin/core"

interface EditTripPageClientProps {
  trip: Trip
  shareCode: string
}

export default function EditTripPageClient({ trip, shareCode }: EditTripPageClientProps) {
  const { t } = useTranslation()
  const router = useRouter()

  const handleSave = async (data: {
    title: string
    coverPhoto?: import("@gotrippin/core").CoverPhotoInput
    color?: string
    dateRange?: DateRange
    locations?: RouteLocation[]
  }) => {
    try {
      const tripData: Record<string, unknown> = {}

      if (data.title !== trip.title) tripData.title = data.title
      if (data.coverPhoto) tripData.cover_photo = data.coverPhoto
      if (data.color !== trip.color) tripData.color = data.color

      if (data.dateRange?.from) {
        const newStartDate = data.dateRange.from.toISOString()
        if (newStartDate !== trip.start_date) tripData.start_date = newStartDate
      } else if (trip.start_date) {
        tripData.start_date = null
      }

      if (data.dateRange?.to) {
        const newEndDate = data.dateRange.to.toISOString()
        if (newEndDate !== trip.end_date) tripData.end_date = newEndDate
      } else if (trip.end_date) {
        tripData.end_date = null
      }

      if (!trip.id) return

      const result = await updateTripAction(trip.id, tripData as import("@gotrippin/core").TripUpdateData)

      if (result.success) {
        toast.success(t("trips.update_success", { defaultValue: "Trip updated successfully!" }))
        router.push(`/trips/${shareCode}`)
      } else {
        toast.error(t("trips.update_failed", { defaultValue: "Failed to update trip" }), {
          description: result.error,
        })
      }
    } catch (error) {
      toast.error(t("common.error_occurred", { defaultValue: "An error occurred" }), {
        description: error instanceof Error ? error.message : String(error),
      })
    }
  }

  const handleBack = () => {
    router.push(`/trips/${shareCode}`)
  }

  const initialData = {
    title: trip.title || "",
    initialCoverPhoto: (trip as Trip & { cover_photo?: unknown }).cover_photo ?? null,
    color: trip.color ?? undefined,
    dateRange:
      trip.start_date && trip.end_date
        ? { from: new Date(trip.start_date), to: new Date(trip.end_date) }
        : undefined,
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
