"use client"

import { useCallback, useMemo, useRef, useState } from "react"
import type { Trip } from "@gotrippin/core"
import { formatTripDate, calculateDaysUntil, calculateDuration } from "@gotrippin/core"
import { tripNotesStorageToPlainText } from "@/lib/trip-notes-doc"
import TripFilters from "./trip-filters"
import TripGrid from "./trip-grid"
import EmptyState from "./empty-state"
import { TripsListBodySkeleton } from "./trip-skeleton"

export interface TripsListControlledSearch {
  value: string
  onChange: (query: string) => void
}

interface TripsListProps {
  trips: Trip[]
  /** Current user — used to hide self from trip card facepiles. */
  viewerUserId?: string
  loading?: boolean
  onSelectTrip: (shareCode: string) => void
  onCreateTrip: () => void
  /** When set, search is owned by the parent (e.g. floating header); inline search in filters is hidden. */
  controlledSearch?: TripsListControlledSearch
}

export default function TripsList({
  trips,
  viewerUserId,
  loading,
  onSelectTrip,
  onCreateTrip,
  controlledSearch,
}: TripsListProps) {
  const [activeFilter, setActiveFilter] = useState<"all" | "upcoming" | "past">("all")
  const [filterTransition, setFilterTransition] = useState(false)
  const filterTransitionTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [internalSearchQuery, setInternalSearchQuery] = useState("")

  const beginFilterTransition = useCallback(() => {
    setFilterTransition(true)
    if (filterTransitionTimer.current !== null) {
      clearTimeout(filterTransitionTimer.current)
    }
    filterTransitionTimer.current = setTimeout(() => {
      setFilterTransition(false)
      filterTransitionTimer.current = null
    }, 340)
  }, [])

  const handleFilterChange = useCallback(
    (next: "all" | "upcoming" | "past") => {
      if (next === activeFilter) return
      beginFilterTransition()
      setActiveFilter(next)
    },
    [activeFilter, beginFilterTransition],
  )

  const searchQuery = controlledSearch !== undefined ? controlledSearch.value : internalSearchQuery
  const setSearchQuery = controlledSearch !== undefined ? controlledSearch.onChange : setInternalSearchQuery
  const hideSearchInFilters = controlledSearch !== undefined

  const hasTrips = trips.length > 0
  const showListSkeleton = Boolean(loading || filterTransition)

  // Transform trips to include calculated fields - do this once and reuse
  const tripsWithCalculations = useMemo(() => {
    return trips.map(trip => {
      const daysUntil = trip.start_date ? calculateDaysUntil(trip.start_date) : 0
      return {
        ...trip,
        startDate: trip.start_date ? formatTripDate(trip.start_date) : "—",
        endDate: trip.end_date ? formatTripDate(trip.end_date) : "—",
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
    const matchesSearch = (trip: {
      title?: string | null
      destination?: string | null
      description?: string | null
      notes?: string | null
    }) =>
      !query ||
      (trip.title?.toLowerCase().includes(query) ?? false) ||
      (trip.destination?.toLowerCase().includes(query) ?? false) ||
      (trip.description?.toLowerCase().includes(query) ?? false) ||
      tripNotesStorageToPlainText(trip.notes).toLowerCase().includes(query)
    return tripsWithCalculations.filter(
      (trip) => matchesStatus(trip) && matchesSearch(trip)
    )
  }, [tripsWithCalculations, activeFilter, searchQuery])

  return (
    <div className="relative pb-32">
      <div className="relative z-0 min-h-[min(100dvh,48rem)]">
        {showListSkeleton ? (
          <TripsListBodySkeleton />
        ) : (
          <>
            <TripFilters
              activeFilter={activeFilter}
              onFilterChange={handleFilterChange}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              tripsCount={tripsWithCalculations.length}
              hideSearch={hideSearchInFilters}
            />

            {hasTrips ? (
              <TripGrid
                trips={filteredTrips}
                viewerUserId={viewerUserId}
                activeFilter={activeFilter}
                onSelectTrip={onSelectTrip}
              />
            ) : (
              <EmptyState onCreateTrip={onCreateTrip} />
            )}
          </>
        )}
      </div>
    </div>
  )
}
