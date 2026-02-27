"use client";

import { useState, useEffect, useRef } from "react";
import type { MapWaypoint } from "@/components/maps";
import { fetchRoute, type RouteLineFeature } from "@/lib/mapbox-directions";

export interface UseRouteDirectionsResult {
  /** Road route geometry; null while loading, on error, or when &lt; 2 waypoints */
  routeGeo: RouteLineFeature | null;
  loading: boolean;
  error: string | null;
}

/**
 * Fetches Mapbox Directions for the given waypoints and returns road route geometry
 * for drawing on the map. Updates when waypoints change; aborts in-flight requests.
 */
export function useRouteDirections(waypoints: MapWaypoint[]): UseRouteDirectionsResult {
  const [routeGeo, setRouteGeo] = useState<RouteLineFeature | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const withCoords = waypoints.filter(
      (w) => Number.isFinite(w.lat) && Number.isFinite(w.lng)
    );
    if (withCoords.length < 2) {
      setRouteGeo(null);
      setLoading(false);
      setError(null);
      return;
    }

    const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
    if (!token) {
      setRouteGeo(null);
      setLoading(false);
      setError("Mapbox token not configured");
      return;
    }

    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setLoading(true);
    setError(null);

    const points = withCoords.map((w) => ({ lng: w.lng, lat: w.lat }));
    const ac = abortRef.current;
    fetchRoute(points, token, "mapbox/driving", ac.signal)
      .then((geo) => {
        setRouteGeo(geo);
        setError(null);
      })
      .catch((err) => {
        if (err?.name === "AbortError") return;
        console.error("Route directions fetch failed", err);
        setRouteGeo(null);
        setError(err?.message ?? "Failed to load route");
      })
      .finally(() => {
        setLoading(false);
        abortRef.current = null;
      });

    return () => {
      abortRef.current?.abort();
    };
  }, [waypoints]);

  return { routeGeo, loading, error };
}
