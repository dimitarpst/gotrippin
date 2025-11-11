"use client"

import { useState, useMemo } from "react"
import type { Trip } from "@gotrippin/core"
import { formatTripDate, calculateDaysUntil, calculateDuration } from "@/lib/api/trips"
import RecommendedDestinations from "./recommended-destinations"
import TripFilters from "./trip-filters"
import TripGrid from "./trip-grid"
import EmptyState from "./empty-state"
import { TripSkeletonGrid } from "./trip-skeleton"

interface TripsListProps {
  trips: Trip[]
  loading?: boolean
  onSelectTrip: (tripId: string) => void
  onCreateTrip: () => void
}

export default function TripsList({ trips, loading, onSelectTrip, onCreateTrip }: TripsListProps) {
  const [activeFilter, setActiveFilter] = useState<"all" | "upcoming" | "past">("all")
  const hasTrips = trips.length > 0

  const filteredTrips = useMemo(() => {
    return trips.filter((trip) => {
      if (activeFilter === "all") return true
      const daysUntil = trip.start_date ? calculateDaysUntil(trip.start_date) : 0
      if (activeFilter === "upcoming") return daysUntil > 0
      if (activeFilter === "past") return daysUntil < 0
      return true
    })
  }, [activeFilter, trips])

  // Transform trips to include calculated fields
  const tripsWithCalculations = useMemo(() => {
    return filteredTrips.map(trip => ({
      ...trip,
      startDate: trip.start_date ? formatTripDate(trip.start_date) : "TBD",
      endDate: trip.end_date ? formatTripDate(trip.end_date) : "TBD",
      daysUntil: trip.start_date ? calculateDaysUntil(trip.start_date) : 0,
      duration: trip.start_date && trip.end_date ? calculateDuration(trip.start_date, trip.end_date) : 0,
    }))
  }, [filteredTrips])

  return (
    <div className="min-h-screen relative pb-32 overflow-y-auto scrollbar-hide">
      {/* Main Content */}
      <div className="relative z-10 min-h-screen pt-24">
        <RecommendedDestinations />

        <TripFilters
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          tripsCount={trips.length}
        />

        {loading ? (
          <TripSkeletonGrid />
        ) : hasTrips ? (
          <TripGrid
            trips={tripsWithCalculations}
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

