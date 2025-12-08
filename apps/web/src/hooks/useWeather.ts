"use client"

import { useCallback, useEffect, useMemo, useState } from "react";
import type { TripWeatherResponse, TripLocationWeather } from "@gotrippin/core";
import { getTripWeather } from "@/lib/api/weather";

interface UseTripWeatherResult {
  weather: TripWeatherResponse | null;
  byLocation: Record<string, TripLocationWeather>;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useTripWeather(tripId?: string | null, days?: number): UseTripWeatherResult {
  const [weather, setWeather] = useState<TripWeatherResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWeather = useCallback(async () => {
    if (!tripId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await getTripWeather(tripId, days);
      setWeather(data);
    } catch (err) {
      console.error("Failed to fetch trip weather:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch weather");
    } finally {
      setLoading(false);
    }
  }, [tripId, days]);

  useEffect(() => {
    fetchWeather().catch(() => {});
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
    loading,
    error,
    refetch: fetchWeather,
  };
}

