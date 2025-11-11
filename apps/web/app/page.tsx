"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import AuroraBackground from "@/components/effects/aurora-background"
import FloatingHeader from "@/components/layout/FloatingHeader"
import DockBar from "@/components/layout/DockBar"
import TripsList from "@/components/trips/trips-list"
import { useTrips } from "@/hooks/useTrips"
import { useAuth } from "@/contexts/AuthContext"

export default function HomePage() {
  const router = useRouter()

  // Check authentication status - MUST be called before any conditional logic
  const { user, loading: authLoading } = useAuth()

  // Fetch trips data - MUST be called before any conditional logic
  const { trips, loading, error } = useTrips()

  // Handle authentication redirects - AFTER all hooks are called
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth')
    }
  }, [authLoading, user, router])

  const handleSelectTrip = (tripId: string) => {
    router.push(`/trips/${tripId}`)
  }

  const handleCreateTrip = () => {
    router.push('/trips/create')
  }

  // Don't render anything if not authenticated (redirect is handled by useEffect)
  if (!user && !authLoading) {
    return null // Let the redirect happen
  }

  return (
    <main className="relative min-h-screen flex flex-col bg-[var(--color-background)] text-[var(--color-foreground)] overflow-hidden">
      <AuroraBackground />
      <FloatingHeader />

      {/* Trips Content - Replaces the "Go Trippin'" text */}
      <div className="flex-1 relative z-10">
        {error && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2 backdrop-blur-sm">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <TripsList
          trips={trips}
          loading={loading}
          onSelectTrip={handleSelectTrip}
          onCreateTrip={handleCreateTrip}
        />
      </div>

      <DockBar onCreateTrip={handleCreateTrip} />
    </main>
  )
}
