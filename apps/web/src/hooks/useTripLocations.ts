"use client"

import { useState, useEffect, useCallback } from "react"
import type { TripLocation } from "@gotrippin/core"
import { getLocations } from "@/lib/api/trip-locations"
import { useAuth } from "@/contexts/AuthContext"

interface UseTripLocationsResult {
  locations: TripLocation[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useTripLocations(tripId?: string | null): UseTripLocationsResult {
  const [locations, setLocations] = useState<TripLocation[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user, loading: authLoading, accessToken } = useAuth()

  const fetchLocations = useCallback(async () => {
    if (!tripId) return

    // Don't fetch if user is not authenticated or auth is still loading
    if (!user && !authLoading) {
      setLoading(false)
      setError("Authentication required")
      return
    }

    if (authLoading || !accessToken) {
      return // Still loading auth, don't fetch yet
    }

    try {
      setLoading(true)
      setError(null)
      const data = await getLocations(tripId, accessToken)
      setLocations(data || [])
    } catch (err) {
      console.error("Failed to fetch trip locations:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch locations")
    } finally {
      setLoading(false)
    }
  }, [tripId])

  useEffect(() => {
    void fetchLocations()
  }, [fetchLocations])

  return {
    locations,
    loading: loading || authLoading,
    error,
    refetch: fetchLocations,
  }
}


