"use client"

import { useRouter } from "next/navigation"
import { useEffect, use } from "react"
import AuroraBackground from "@/components/effects/aurora-background"
import TripOverview from "@/components/trips/trip-overview"
import TripOverviewSkeleton from "@/components/trips/trip-overview-skeleton"
import { useTrip, useDeleteTrip } from "@/hooks/useTrips"
import { useAuth } from "@/contexts/AuthContext"

interface TripPageProps {
  params: Promise<{
    id: string
  }>
}

export default function TripPage({ params }: TripPageProps) {
  const router = useRouter()
  const resolvedParams = use(params)
  const tripId = resolvedParams.id
  const { user, loading: authLoading } = useAuth()
  const { trip, loading: tripLoading } = useTrip(tripId)
  const { deleteTrip } = useDeleteTrip()

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth')
    }
  }, [authLoading, user, router])

  const handleNavigate = (screen: string) => {
    if (screen === "overview") {
      // Stay on current page
    } else if (screen === "activity") {
      router.push(`/trips/${tripId}/activity`)
    } else if (screen === "flight") {
      router.push(`/trips/${tripId}/activity/flight`)
    }
  }

  const handleBack = () => {
    router.push('/')
  }

  const handleEdit = () => {
    router.push(`/trips/${tripId}/edit`)
  }

  const handleDelete = async () => {
    const success = await deleteTrip(tripId)
    if (success) {
      router.push('/')
    }
  }

  if (authLoading) {
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

  // For now, just show the overview. We can extend this later for activity/flight sub-routes
  return (
    <main className="relative min-h-screen flex flex-col bg-[var(--color-background)] text-[var(--color-foreground)] overflow-hidden">
      <AuroraBackground />

      <div className="flex-1 relative z-10">
        {trip && !tripLoading ? (
          <TripOverview
            trip={trip}
            onNavigate={handleNavigate}
            onBack={handleBack}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ) : (
          <TripOverviewSkeleton onBack={handleBack} />
        )}
      </div>
    </main>
  )
}
