"use client"

import { useRouter } from "next/navigation"
import AuroraBackground from "@/components/effects/aurora-background"
import FloatingHeader from "@/components/layout/FloatingHeader"
import DockBar from "@/components/layout/DockBar"
import TripsList from "@/components/trips/trips-list"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { useTrips } from "@/hooks/useTrips"
import { useAuth } from "@/contexts/AuthContext"

function ProtectedHomeContent() {
  const router = useRouter()
  const { trips, loading, error } = useTrips()

  const handleSelectTrip = (shareCode: string) => {
    router.push(`/trips/${shareCode}`)
  }

  const handleCreateTrip = () => {
    router.push("/trips/create")
  }

  return (
    <main className="relative min-h-screen flex flex-col bg-[var(--color-background)] text-[var(--color-foreground)] overflow-hidden">
      <AuroraBackground />
      <FloatingHeader />

      <div className="flex-1 relative z-10">
        {error && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 w-full max-w-md px-4">
            <Alert variant="destructive" className="bg-destructive/10 backdrop-blur-md border-destructive/20">
              <AlertCircle className="size-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
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

export default function HomePage() {
  const { user, loading: authLoading } = useAuth()

  // Middleware handles auth redirect; show loading until AuthContext resolves
  if (authLoading || !user) {
    return null
  }

  return <ProtectedHomeContent />
}
