"use client";

import { useEffect, useMemo } from "react";
import Map, { Marker, Source, Layer, useMap } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import type { RouteLineFeature } from "@/lib/mapbox-directions";

// Console: WEBGL_debug_renderer_info, texSubImage, and CORS to events.mapbox.com are expected/harmless (see docs/MAPS_IMPLEMENTATION.md).

export interface MapWaypoint {
  lat: number;
  lng: number;
  name?: string;
}

const DEFAULT_CENTER = { longitude: 23.32, latitude: 42.7 };
const DEFAULT_ZOOM = 3;
const MAPBOX_DARK_STYLE = "mapbox://styles/mapbox/dark-v11";
const FOCUS_ZOOM = 14;
const FLY_DURATION_MS = 1200;

/** When focusLngLat is set, flies the map to that point. Rendered inside Map so useMap() works. */
function MapFlyTo({
  focusLngLat,
}: {
  focusLngLat: { lng: number; lat: number } | null;
}) {
  const { current: map } = useMap();
  useEffect(() => {
    if (!focusLngLat || !map) return;
    map.flyTo({
      center: [focusLngLat.lng, focusLngLat.lat],
      zoom: FOCUS_ZOOM,
      duration: FLY_DURATION_MS,
    });
  }, [focusLngLat, map]);
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

function waypointsToLineGeometry(waypoints: MapWaypoint[]) {
  return {
    type: "Feature" as const,
    properties: {},
    geometry: {
      type: "LineString" as const,
      coordinates: waypoints.map((w) => [w.lng, w.lat]),
    },
  };
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
  /** When set, shows a highlight marker at this point (e.g. preview before adding a stop). */
  previewLngLat?: { lng: number; lat: number } | null;
  /** Road route geometry from Mapbox Directions; when set, drawn instead of straight segments. */
  routeLineGeo?: RouteLineFeature | null;
}

export default function MapView({
  waypoints,
  className,
  fitToRoute = true,
  fitPadding = 60,
  interactive = true,
  focusLngLat = null,
  previewLngLat = null,
  routeLineGeo = null,
}: MapViewProps) {
  const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

  const { initialViewState, lineGeo } = useMemo(() => {
    const withCoords = waypoints.filter((w) => Number.isFinite(w.lat) && Number.isFinite(w.lng));
    const bounds = withCoords.length > 0 ? getBounds(withCoords) : null;
    const straightLine = withCoords.length >= 2 ? waypointsToLineGeometry(withCoords) : null;
    const lineGeo = routeLineGeo ?? straightLine;
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

  return (
    <div className={className} style={{ width: "100%", height: "100%" }}>
      <Map
        mapboxAccessToken={token}
        initialViewState={initialViewState}
        mapStyle={MAPBOX_DARK_STYLE}
        style={{ width: "100%", height: "100%" }}
        interactive={interactive}
      >
        <MapFlyTo focusLngLat={focusLngLat} />
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
          <Layer
            id="route-line-layer"
            type="line"
            paint={{
              "line-color": "#ff6b6b",
              "line-width": 3,
            }}
          />
        </Source>
      )}
      {waypoints
        .filter((w) => Number.isFinite(w.lat) && Number.isFinite(w.lng))
        .map((w, i) => (
          <Marker
            key={`${w.lng}-${w.lat}-${i}`}
            longitude={w.lng}
            latitude={w.lat}
            anchor="bottom"
          >
            <div
              className="h-6 w-6 rounded-full border-2 border-white bg-[#ff6b6b] shadow-lg"
              title={w.name}
            />
          </Marker>
        ))}
      </Map>
    </div>
  );
}
