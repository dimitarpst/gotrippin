"use client"

import { useState, useMemo } from "react"
import type { Trip } from "@gotrippin/core"
import { formatTripDate, calculateDaysUntil, calculateDuration } from "@gotrippin/core"
import RecommendedDestinations from "./recommended-destinations"
import TripFilters from "./trip-filters"
import TripGrid from "./trip-grid"
import EmptyState from "./empty-state"
import { TripSkeletonGrid } from "./trip-skeleton"

interface TripsListProps {
  trips: Trip[]
  loading?: boolean
  onSelectTrip: (shareCode: string) => void
  onCreateTrip: () => void
}

export default function TripsList({ trips, loading, onSelectTrip, onCreateTrip }: TripsListProps) {
  const [activeFilter, setActiveFilter] = useState<"all" | "upcoming" | "past">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const hasTrips = trips.length > 0

  // Transform trips to include calculated fields - do this once and reuse
  const tripsWithCalculations = useMemo(() => {
    return trips.map(trip => {
      const daysUntil = trip.start_date ? calculateDaysUntil(trip.start_date) : 0
      return {
        ...trip,
        startDate: trip.start_date ? formatTripDate(trip.start_date) : "TBD",
        endDate: trip.end_date ? formatTripDate(trip.end_date) : "TBD",
        daysUntil,
        duration: trip.start_date && trip.end_date ? calculateDuration(trip.start_date, trip.end_date) : 0,
      }
    })
  }, [trips])

  const filteredTrips = useMemo(() => {
    const filter = activeFilter
    const query = searchQuery.toLowerCase().trim()
    const matchesStatus = (trip: { daysUntil: number }) =>
      filter === "all" || (filter === "upcoming" && trip.daysUntil > 0) || (filter === "past" && trip.daysUntil < 0)
    const matchesSearch = (trip: { title?: string | null; destination?: string | null; description?: string | null }) =>
      !query ||
      (trip.title?.toLowerCase().includes(query) ?? false) ||
      (trip.destination?.toLowerCase().includes(query) ?? false) ||
      (trip.description?.toLowerCase().includes(query) ?? false)
    return tripsWithCalculations.filter(
      (trip) => matchesStatus(trip) && matchesSearch(trip)
    )
  }, [tripsWithCalculations, activeFilter, searchQuery])

  return (
    <div className="min-h-screen relative pb-32 overflow-y-auto scrollbar-hide">
      {/* Main Content */}
      <div className="relative z-10 min-h-screen pt-24">
        <RecommendedDestinations />

        <TripFilters
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          tripsCount={filteredTrips.length}
        />

        {loading ? (
          <TripSkeletonGrid />
        ) : hasTrips ? (
          <TripGrid
            trips={filteredTrips}
            activeFilter={activeFilter}
            onSelectTrip={onSelectTrip}
          />
        ) : (
          <EmptyState onCreateTrip={onCreateTrip} />
        )}
      </div>
    </div>
  )
}

