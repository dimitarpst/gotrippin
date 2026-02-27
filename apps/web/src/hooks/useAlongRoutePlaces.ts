"use client";

import { useEffect, useMemo, useState } from "react";
import type { MapWaypoint } from "@/components/maps";
import { searchNearbyPlaces, type GooglePlaceResult } from "@/lib/googlePlaces";

export type AlongRouteCategory = "food" | "sights" | "stays" | "other";

export interface AlongRoutePlace extends GooglePlaceResult {
  category: AlongRouteCategory;
}

function categorize(primaryType?: string): AlongRouteCategory {
  if (!primaryType) return "other";
  const t = primaryType.toLowerCase();
  if (t.includes("restaurant") || t.includes("cafe") || t.includes("bar")) return "food";
  if (t.includes("lodging") || t.includes("hotel")) return "stays";
  if (t.includes("tourist_attraction") || t.includes("museum") || t.includes("park")) return "sights";
  return "other";
}

function computeSamplePoints(waypoints: MapWaypoint[], maxSamples = 5) {
  if (waypoints.length < 2) return [];
  const segments: Array<{ a: MapWaypoint; b: MapWaypoint }> = [];
  for (let i = 0; i < waypoints.length - 1; i++) {
    segments.push({ a: waypoints[i], b: waypoints[i + 1] });
  }
  if (segments.length <= maxSamples) {
    return segments.map(({ a, b }) => ({
      lat: (a.lat + b.lat) / 2,
      lng: (a.lng + b.lng) / 2,
    }));
  }
  const pts: { lat: number; lng: number }[] = [];
  const step = segments.length / maxSamples;
  for (let i = 0; i < maxSamples; i++) {
    const idx = Math.floor(i * step);
    const { a, b } = segments[idx];
    pts.push({ lat: (a.lat + b.lat) / 2, lng: (a.lng + b.lng) / 2 });
  }
  return pts;
}

export function useAlongRoutePlaces(waypoints: MapWaypoint[]) {
  const [places, setPlaces] = useState<AlongRoutePlace[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const samples = useMemo(() => computeSamplePoints(waypoints), [waypoints]);

  useEffect(() => {
    if (samples.length === 0) {
      setPlaces([]);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    const key = samples.map((p) => `${p.lat.toFixed(3)},${p.lng.toFixed(3)}`).join("|");

    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const results = await Promise.all(
          samples.map((center) =>
            searchNearbyPlaces({
              location: center,
              radiusMeters: 3000,
              includedTypes: ["restaurant", "cafe", "tourist_attraction", "lodging"],
              maxResultCount: 6,
            }).catch(() => [] as GooglePlaceResult[])
          )
        );
        if (cancelled) return;
        const flat = results.flat();
        const seen = new Set<string>();
        const dedup: AlongRoutePlace[] = [];
        for (const p of flat) {
          if (!p.id || seen.has(p.id)) continue;
          seen.add(p.id);
          dedup.push({ ...p, category: categorize(p.primaryType) });
        }
        setPlaces(dedup.slice(0, 24));
      } catch (err) {
        if (cancelled) return;
        console.error("Failed to load along-route places", err);
        const msg = err instanceof Error ? err.message : "Failed to load places along route";
        setError(msg);
        setPlaces([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    // slight delay so we don't hammer while editing route
    const t = setTimeout(run, 700);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [samples.map((p) => `${p.lat.toFixed(3)},${p.lng.toFixed(3)}`).join("|")]);

  return { places, loading, error };
}

