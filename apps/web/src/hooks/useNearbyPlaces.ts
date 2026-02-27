"use client";

import { useEffect, useState } from "react";
import { searchNearbyPlaces, type GooglePlaceResult } from "@/lib/googlePlaces";

interface Center {
  lat: number;
  lng: number;
}

interface UseNearbyPlacesOptions {
  enabled: boolean;
  center: Center | null;
  radiusMeters?: number;
  minZoom?: number;
  zoom?: number | null;
  includedTypes?: string[];
}

export function useNearbyPlaces({
  enabled,
  center,
  radiusMeters = 4000,
  minZoom = 9,
  zoom = null,
  includedTypes,
}: UseNearbyPlacesOptions) {
  const [results, setResults] = useState<GooglePlaceResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setResults([]);
      setLoading(false);
      setError(null);
      return;
    }
    if (!center) return;
    if (zoom != null && zoom < minZoom) {
      setResults([]);
      return;
    }

    const key = `${center.lat.toFixed(3)},${center.lng.toFixed(3)},${radiusMeters},${(includedTypes ?? []).join(",")}`;
    let cancelled = false;

    const timeout = setTimeout(async () => {
      try {
        setLoading(true);
        setError(null);
        const places = await searchNearbyPlaces({
          location: center,
          radiusMeters,
          includedTypes,
          maxResultCount: 20,
        });
        if (cancelled) return;
        setResults(places);
      } catch (err) {
        if (cancelled) return;
        console.error("Failed to load nearby places", err);
        const message = err instanceof Error ? err.message : "Failed to load nearby places";
        setError(message);
        setResults([]);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }, 800);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, center?.lat, center?.lng, radiusMeters, minZoom, zoom, (includedTypes ?? []).join(",")]);

  return { results, loading, error };
}

