"use client"

import { useRouter } from "next/navigation"
import AuroraBackground from "@/components/effects/aurora-background"
import CreateTrip from "@/components/trips/create-trip"
import { useCreateTrip, useTrips } from "@/hooks/useTrips"
import { useAuth } from "@/contexts/AuthContext"
import { useEffect } from "react"
import type { DateRange } from "react-day-picker"

export default function CreateTripPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { create, creating } = useCreateTrip()
  const { refetch } = useTrips()

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth')
    }
  }, [authLoading, user, router])

  const handleSave = async (data: { title: string; imageUrl?: string; color?: string; dateRange?: DateRange }) => {
    try {
      const newTrip = await create({
        title: data.title,
        image_url: data.imageUrl,
        color: data.color,
        start_date: data.dateRange?.from?.toISOString(),
        end_date: data.dateRange?.to?.toISOString(),
      })

      if (newTrip) {
        await refetch()
        router.push('/')
      }
    } catch (error) {
      console.error("Failed to create trip:", error)
    }
  }

  const handleBack = () => {
    router.push('/')
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
