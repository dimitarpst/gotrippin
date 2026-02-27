"use client";

import { useEffect, useMemo, type ReactNode } from "react";
import Map, { Marker, Source, Layer, useMap } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import type { MapMouseEvent } from "mapbox-gl";
import { straightLineLegs, type RouteLegsGeoJSON } from "@/lib/mapbox-directions";
import { getLegColor } from "@/lib/route-colors";

// Console: WEBGL_debug_renderer_info, texSubImage, and CORS to events.mapbox.com are expected/harmless (see docs/MAPS_IMPLEMENTATION.md).

export interface MapWaypoint {
  lat: number;
  lng: number;
  name?: string;
}

const DEFAULT_CENTER = { longitude: 23.32, latitude: 42.7 };
const DEFAULT_ZOOM = 3;
// Use a label- and POI-rich basemap so the map never feels empty.
// Standard requires a different SDK; stick to streets-v12 for GL JS.
const MAPBOX_BASE_STYLE = "mapbox://styles/mapbox/streets-v12";
const FOCUS_ZOOM = 14;
const FLY_DURATION_MS = 1200;

/* eslint-disable @typescript-eslint/no-explicit-any */
const LINE_PAINT: Record<string, any> = {
  "line-color": ["get", "color"],
  "line-width": 3,
};
const LINE_LAYOUT: Record<string, any> = {
  "line-join": "round",
  "line-cap": "round",
};
/* eslint-enable @typescript-eslint/no-explicit-any */

function MapFlyTo({
  focusLngLat,
  focusZoom,
}: {
  focusLngLat: { lng: number; lat: number } | null;
  focusZoom: number;
}) {
  const { current: map } = useMap();
  useEffect(() => {
    if (!focusLngLat || !map) return;
    map.flyTo({
      center: [focusLngLat.lng, focusLngLat.lat],
      zoom: focusZoom,
      duration: FLY_DURATION_MS,
    });
  }, [focusLngLat, focusZoom, map]);
  return null;
}

function getBounds(waypoints: MapWaypoint[]): [[number, number], [number, number]] | null {
  if (waypoints.length === 0) return null;
  let minLng = waypoints[0].lng;
  let maxLng = waypoints[0].lng;
  let minLat = waypoints[0].lat;
  let maxLat = waypoints[0].lat;
  for (const w of waypoints) {
    minLng = Math.min(minLng, w.lng);
    maxLng = Math.max(maxLng, w.lng);
    minLat = Math.min(minLat, w.lat);
    maxLat = Math.max(maxLat, w.lat);
  }
  const padding = 0.05;
  const spanLng = Math.max(maxLng - minLng, padding);
  const spanLat = Math.max(maxLat - minLat, padding);
  return [
    [minLng - spanLng * 0.1, minLat - spanLat * 0.1],
    [maxLng + spanLng * 0.1, maxLat + spanLat * 0.1],
  ];
}

interface MapViewProps {
  waypoints: MapWaypoint[];
  className?: string;
  /** If set, map fits bounds to waypoints on mount and when waypoints change */
  fitToRoute?: boolean;
  /** Optional padding (px) when fitting bounds */
  fitPadding?: number;
  /** Whether the map responds to user interaction (drag, zoom). Default true. */
  interactive?: boolean;
  /** When set, map flies to this point (e.g. when user taps a route stop). */
  focusLngLat?: { lng: number; lat: number } | null;
  /** Optional zoom level used when focusLngLat is set. Default 14. */
  focusZoom?: number;
  /** When set, shows a highlight marker at this point (e.g. preview before adding a stop). */
  previewLngLat?: { lng: number; lat: number } | null;
  /** Called when user clicks the map (useful for adding stops by dropping a pin). */
  onMapClick?: ((lngLat: { lng: number; lat: number }) => void) | null;
  /** Optional callback when map stops moving; used for nearby POIs. */
  onMoveEnd?: ((state: { center: { lng: number; lat: number }; zoom: number }) => void) | null;
  /** Per-leg route geometry from Mapbox Directions; when set, drawn instead of straight segments. */
  routeLineGeo?: RouteLegsGeoJSON | null;
  /** Optional extra content rendered inside the map (e.g. POI markers). */
  children?: ReactNode;
}

export default function MapView({
  waypoints,
  className,
  fitToRoute = true,
  fitPadding = 60,
  interactive = true,
  focusLngLat = null,
  focusZoom = FOCUS_ZOOM,
  previewLngLat = null,
  onMapClick = null,
  onMoveEnd = null,
  routeLineGeo = null,
  children,
}: MapViewProps) {
  const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

  const { initialViewState, lineGeo } = useMemo(() => {
    const withCoords = waypoints.filter((w) => Number.isFinite(w.lat) && Number.isFinite(w.lng));
    const bounds = withCoords.length > 0 ? getBounds(withCoords) : null;
    const fallback =
      withCoords.length >= 2
        ? straightLineLegs(withCoords.map((w) => ({ lng: w.lng, lat: w.lat })))
        : null;
    const lineGeo = routeLineGeo ?? fallback;
    const initialViewState =
      fitToRoute && bounds
        ? {
            bounds: bounds as [[number, number], [number, number]],
            fitBoundsOptions: { padding: fitPadding, maxZoom: 14 },
          }
        : {
            ...DEFAULT_CENTER,
            zoom: DEFAULT_ZOOM,
          };
    return { initialViewState, lineGeo };
  }, [waypoints, fitToRoute, fitPadding, routeLineGeo]);

  if (!token) {
    return (
      <div
        className={className}
        style={{ minHeight: 200, background: "#0a0a0a", borderRadius: 12 }}
      >
        <div className="flex h-full min-h-[200px] items-center justify-center text-white/60 text-sm">
          Map unavailable: NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN not set
        </div>
      </div>
    );
  }

  const validWaypoints = waypoints.filter(
    (w) => Number.isFinite(w.lat) && Number.isFinite(w.lng)
  );
  const numLegs = Math.max(validWaypoints.length - 1, 0);

  return (
    <div className={className} style={{ width: "100%", height: "100%" }}>
      <Map
        mapboxAccessToken={token}
        initialViewState={initialViewState}
        mapStyle={MAPBOX_BASE_STYLE}
        style={{ width: "100%", height: "100%" }}
        interactive={interactive}
        onClick={(e: MapMouseEvent) => {
          if (!onMapClick) return;
          onMapClick({ lng: e.lngLat.lng, lat: e.lngLat.lat });
        }}
        onMoveEnd={(e) => {
          if (!onMoveEnd) return;
          const center = e.target.getCenter();
          const zoom = e.target.getZoom();
          onMoveEnd({ center: { lng: center.lng, lat: center.lat }, zoom });
        }}
      >
        <MapFlyTo focusLngLat={focusLngLat} focusZoom={focusZoom} />
      {previewLngLat && (
        <Marker
          longitude={previewLngLat.lng}
          latitude={previewLngLat.lat}
          anchor="bottom"
        >
          <div
            className="h-8 w-8 rounded-full border-2 border-white bg-amber-400/90 shadow-lg ring-4 ring-amber-400/30"
          />
        </Marker>
      )}
      {lineGeo && (
        <Source id="route-line" type="geojson" data={lineGeo}>
          <Layer id="route-line-layer" type="line" paint={LINE_PAINT} layout={LINE_LAYOUT} />
        </Source>
      )}
      {validWaypoints.map((w, i) => (
          <Marker
            key={`${w.lng}-${w.lat}-${i}`}
            longitude={w.lng}
            latitude={w.lat}
            anchor="bottom"
          >
            <div
              className="h-6 w-6 rounded-full border-2 border-white shadow-lg"
              style={{ backgroundColor: getLegColor(Math.min(i, numLegs - 1)) }}
              title={w.name}
            />
          </Marker>
        ))}
      {children}
      </Map>
    </div>
  );
}
