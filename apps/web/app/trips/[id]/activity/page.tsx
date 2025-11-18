"use client"

import { useRouter } from "next/navigation"
import { use } from "react"
import AuroraBackground from "@/components/effects/aurora-background"
import ActivitySelector from "@/components/trips/activity-selector"

interface ActivityPageProps {
  params: Promise<{
    id: string
  }>
}

export default function ActivityPage({ params }: ActivityPageProps) {
  const router = useRouter()
  const resolvedParams = use(params)
  const tripId = resolvedParams.id

  const handleBack = () => {
    router.push(`/trips/${tripId}`)
  }

  return (
    <main className="relative min-h-screen flex flex-col bg-[var(--color-background)] text-[var(--color-foreground)] overflow-hidden">
      <AuroraBackground />
      <div className="flex-1 relative z-10">
        <ActivitySelector tripId={tripId} onBack={handleBack} />
      </div>
    </main>
  )
}

