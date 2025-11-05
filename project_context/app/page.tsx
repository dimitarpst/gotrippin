"use client"

import { useState } from "react"
import TripsList from "@/components/trips-list"
import TripOverview from "@/components/trip-overview"
import ActivitySelector from "@/components/activity-selector"
import FlightEditor from "@/components/flight-editor"
import CreateTrip from "@/components/create-trip"

export default function Home() {
  const [currentScreen, setCurrentScreen] = useState<"list" | "overview" | "activity" | "flight" | "create">("list")
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null)

  const handleSelectTrip = (tripId: string) => {
    setSelectedTripId(tripId)
    setCurrentScreen("overview")
  }

  return (
    <main className="min-h-screen relative">
      <div
        className="fixed inset-0 -z-10"
        style={{
          background:
            "radial-gradient(circle at 20% 50%, rgba(255, 107, 107, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(255, 107, 107, 0.1) 0%, transparent 50%), #0a0a0a",
        }}
      />

      {currentScreen === "list" && (
        <TripsList onSelectTrip={handleSelectTrip} onCreateTrip={() => setCurrentScreen("create")} />
      )}
      {currentScreen === "overview" && (
        <TripOverview onNavigate={(screen) => setCurrentScreen(screen)} onBack={() => setCurrentScreen("list")} />
      )}
      {currentScreen === "activity" && <ActivitySelector onBack={() => setCurrentScreen("overview")} />}
      {currentScreen === "flight" && <FlightEditor onBack={() => setCurrentScreen("activity")} />}
      {currentScreen === "create" && <CreateTrip onBack={() => setCurrentScreen("list")} />}
    </main>
  )
}
