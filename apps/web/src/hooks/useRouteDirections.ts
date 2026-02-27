"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import type { MapWaypoint } from "@/components/maps";
import { fetchRoute, type RouteLegsGeoJSON } from "@/lib/mapbox-directions";

export interface UseRouteDirectionsResult {
  /** Per-leg route geometry FeatureCollection; null while loading, on error, or when &lt; 2 waypoints */
  routeGeo: RouteLegsGeoJSON | null;
  loading: boolean;
  error: string | null;
}

/** Stable key so we only refetch when coordinates actually change (avoids duplicate requests from new array refs). */
function waypointsKey(waypoints: MapWaypoint[]): string {
  const withCoords = waypoints.filter(
    (w) => Number.isFinite(w.lat) && Number.isFinite(w.lng)
  );
  return withCoords.map((w) => `${w.lng},${w.lat}`).join("|");
}

/**
 * Fetches Mapbox Directions for the given waypoints and returns road route geometry
 * for drawing on the map. Updates when waypoints change; aborts in-flight requests.
 * Avoids synchronous setState in the effect (only updates state in async callbacks).
 */
export function useRouteDirections(waypoints: MapWaypoint[]): UseRouteDirectionsResult {
  const [routeGeo, setRouteGeo] = useState<RouteLegsGeoJSON | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const key = useMemo(() => waypointsKey(waypoints), [waypoints]);
  const needsFetch = key.split("|").length >= 2;
  const token = typeof process !== "undefined" ? process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN : undefined;
  const tokenError = needsFetch && !token ? "Mapbox token not configured" : null;

  useEffect(() => {
    if (!needsFetch || !token) return;

    abortRef.current?.abort();
    abortRef.current = new AbortController();
    queueMicrotask(() => {
      setLoading(true);
      setError(null);
    });

    const points = key.split("|").map((s) => {
      const [lng, lat] = s.split(",").map(Number);
      return { lng, lat };
    });
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
  }, [key, needsFetch, token]);

  if (!needsFetch) return { routeGeo: null, loading: false, error: null };
  if (tokenError) return { routeGeo: null, loading: false, error: tokenError };
  return { routeGeo, loading, error };
}
  