"use client"

import { useRouter } from "next/navigation"
import { useEffect, use, useState } from "react"
import AuroraBackground from "@/components/effects/aurora-background"
import TripOverview from "@/components/trips/trip-overview"
import TripOverviewSkeleton from "@/components/trips/trip-overview-skeleton"
import { useTrip, useDeleteTrip, useUpdateTrip } from "@/hooks/useTrips"
import { useAuth } from "@/contexts/AuthContext"
import { useTranslation } from "react-i18next"
import type { DateRange } from "react-day-picker"

interface TripPageProps {
  params: Promise<{
    id: string
  }>
}

export default function TripPage({ params }: TripPageProps) {
  const { t } = useTranslation()
  const router = useRouter()
  const resolvedParams = use(params)
  const shareCode = resolvedParams.id // Route param is 'id' but we use it as shareCode
  const { user, loading: authLoading } = useAuth()
  const { trip: fetchedTrip, loading: tripLoading, refetch: refetchTrip } = useTrip(shareCode)
  const { deleteTrip } = useDeleteTrip()
  const { update: updateTrip } = useUpdateTrip()
  const [mounted, setMounted] = useState(false)
  const [localTrip, setLocalTrip] = useState(fetchedTrip)

  // Sync local trip with fetched trip
  useEffect(() => {
    if (fetchedTrip) {
      setLocalTrip(fetchedTrip)
    }
  }, [fetchedTrip])

  const trip = localTrip || fetchedTrip

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth')
    }
  }, [authLoading, user, router])

  const handleNavigate = (screen: string) => {
    if (screen === "overview") {
      // Stay on current page
    } else if (screen === "activity") {
      router.push(`/trips/${shareCode}/activity`)
    } else if (screen === "flight") {
      router.push(`/trips/${shareCode}/activity/flight`)
    } else if (screen === "weather") {
      router.push(`/trips/${shareCode}/weather`)
    }
  }

  const handleBack = () => {
    router.push('/')
  }

  const handleEdit = () => {
    router.push(`/trips/${shareCode}/edit`)
  }

  const handleDelete = async () => {
    // Delete requires trip ID, not share code
    if (!trip?.id) {
      console.error('Cannot delete: trip ID not available')
      return
    }
    const success = await deleteTrip(trip.id)
    if (success) {
      router.push('/')
    }
  }

  const handleShare = () => {
    // TODO: Implement share functionality
    console.log('Share trip:', shareCode)
    // Could open a share dialog or copy share code to clipboard
  }

  const handleManageGuests = () => {
    // TODO: Implement manage guests functionality
    console.log('Manage guests for trip:', shareCode)
    // Could navigate to a guests management page
  }

  const handleEditName = () => {
    // TODO: Implement edit name functionality
    console.log('Edit trip name:', shareCode)
    // Could open an inline edit or navigate to edit page
    // For now, redirect to edit page
    router.push(`/trips/${shareCode}/edit`)
  }

  const handleChangeDates = async (dateRange: DateRange | undefined) => {
    if (!trip?.id || !dateRange?.from) {
      return
    }

    const updateData: {
      start_date?: string | null
      end_date?: string | null
    } = {
      start_date: dateRange.from ? dateRange.from.toISOString() : null,
      end_date: dateRange.to ? dateRange.to.toISOString() : null,
    }

    // Optimistically update local state
    if (trip) {
      setLocalTrip({
        ...trip,
        start_date: updateData.start_date || null,
        end_date: updateData.end_date || null,
      })
    }

    const updatedTrip = await updateTrip(trip.id, updateData)
    if (updatedTrip) {
      setLocalTrip(updatedTrip)
      // Also refetch to ensure we have the latest data
      refetchTrip().catch(console.error)
    } else {
      // Revert on error
      setLocalTrip(fetchedTrip)
    }
  }

  const handleChangeBackground = async (type: "image" | "color", value: string) => {
    if (!trip?.id) {
      return
    }

    const updateData: {
      image_url?: string | null
      color?: string | null
    } = {}

    if (type === "image") {
      updateData.image_url = value
      updateData.color = null
    } else {
      updateData.color = value
      updateData.image_url = null
    }

    // Optimistically update local state immediately
    if (trip) {
      setLocalTrip({
        ...trip,
        image_url: updateData.image_url ?? trip.image_url,
        color: updateData.color ?? trip.color,
      })
    }

    const updatedTrip = await updateTrip(trip.id, updateData)
    if (updatedTrip) {
      setLocalTrip(updatedTrip)
      // Also refetch to ensure we have the latest data
      refetchTrip().catch(console.error)
    } else {
      // Revert on error
      setLocalTrip(fetchedTrip)
    }
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

  // For now, just show the overview. We can extend this later for activity/flight sub-routes
  return (
    <main className="relative min-h-screen flex flex-col bg-[var(--color-background)] text-[var(--color-foreground)] overflow-hidden">
      <AuroraBackground />

      <div className="flex-1 relative z-10">
        {trip && !tripLoading ? (
          <TripOverview
            key={`${trip.id}-${trip.image_url || trip.color || 'default'}-${trip.start_date || ''}-${trip.end_date || ''}`}
            trip={trip}
            onNavigate={handleNavigate}
            onBack={handleBack}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onShare={handleShare}
            onManageGuests={handleManageGuests}
            onEditName={handleEditName}
            onChangeDates={handleChangeDates}
            onChangeBackground={handleChangeBackground}
          />
        ) : (
          <TripOverviewSkeleton onBack={handleBack} />
        )}
      </div>
    </main>
  )
}
