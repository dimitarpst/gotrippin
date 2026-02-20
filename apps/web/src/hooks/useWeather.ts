"use client"

import { useCallback, useEffect, useMemo, useState } from "react";
import type { TripWeatherResponse, TripLocationWeather } from "@gotrippin/core";
import { getTripWeather } from "@/lib/api/weather";
import { useAuth } from "@/contexts/AuthContext";

interface UseTripWeatherResult {
  weather: TripWeatherResponse | null;
  byLocation: Record<string, TripLocationWeather>;
  fetchedAt: number | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useTripWeather(tripId?: string | null, days?: number): UseTripWeatherResult {
  const [weather, setWeather] = useState<TripWeatherResponse | null>(null);
  const [fetchedAt, setFetchedAt] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, loading: authLoading, accessToken } = useAuth();

  const fetchWeather = useCallback(async () => {
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
      const data = await getTripWeather(tripId, days, accessToken);
      setWeather(data);
      setFetchedAt(Date.now());
    } catch (err) {
      console.error("Failed to fetch trip weather:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch weather");
    } finally {
      setLoading(false);
    }
  }, [tripId, days, user, authLoading, accessToken]);

  useEffect(() => {
    void fetchWeather();
  }, [fetchWeather]);

  const byLocation = useMemo(() => {
    if (!weather) return {};
    return weather.locations.reduce<Record<string, TripLocationWeather>>((acc, loc) => {
      acc[loc.locationId] = loc;
      return acc;
    }, {});
  }, [weather]);

  return {
    weather,
    byLocation,
    fetchedAt,
    loading: loading || authLoading,
    error,
    refetch: fetchWeather,
  };
}

