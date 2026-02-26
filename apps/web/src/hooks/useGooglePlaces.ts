import { useCallback, useState } from "react";
import { searchPlaces, type GooglePlaceResult } from "@/lib/googlePlaces";

interface LocationHint {
  lat: number;
  lng: number;
}

export function useGooglePlaces(initialLocation?: LocationHint) {
  const [results, setResults] = useState<GooglePlaceResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(
    async (query: string, locationOverride?: LocationHint) => {
      const trimmed = query.trim();

      if (!trimmed) {
        setResults([]);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const location = locationOverride ?? initialLocation;
        const places = await searchPlaces(trimmed, location);
        setResults(places);
      } catch (err) {
        console.error("Failed to search places", err);
        const message = err instanceof Error ? err.message : "Failed to search places";
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    [initialLocation],
  );

  return {
    results,
    loading,
    error,
    search,
  };
}

