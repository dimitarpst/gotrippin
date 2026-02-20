"use client";

import { useState, useEffect, useCallback } from "react";
import type { Activity, TripLocation } from "@gotrippin/core";
import {
  getGroupedActivities,
  normalizeTimelineData,
  type TimelineData,
} from "@/lib/api/activities";
import { useAuth } from "@/contexts/AuthContext";

interface UseTripTimelineResult extends TimelineData {
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useTripTimeline(tripId?: string | null): UseTripTimelineResult {
  const [data, setData] = useState<TimelineData>({
    locations: [],
    activitiesByLocation: {},
    unassigned: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, loading: authLoading, accessToken } = useAuth();

  const fetchData = useCallback(async () => {
    if (!tripId) return;

    // Don't fetch if user is not authenticated or auth is still loading
    if (!user && !authLoading) {
      setLoading(false);
      setError("Authentication required");
      return;
    }

    if (authLoading || !accessToken) {
      return; // Still loading auth, don't fetch yet
    }

    try {
      setLoading(true);
      setError(null);
      const raw = await getGroupedActivities(tripId, accessToken);
      const normalized = normalizeTimelineData(raw);
      setData(normalized);
    } catch (err) {
      console.error("Failed to fetch trip timeline:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch timeline");
    } finally {
      setLoading(false);
    }
  }, [tripId, user, authLoading, accessToken]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  return {
    ...data,
    loading: loading || authLoading,
    error,
    refetch: fetchData,
  };
}


