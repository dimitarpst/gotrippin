"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Map, { Marker, Source, Layer, useMap } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import type { Map as MapboxMap, MapMouseEvent } from "mapbox-gl";
import {
  recolorRouteGeoByWaypointMarkers,
  straightLineLegs,
  type RouteLegsGeoJSON,
} from "@/lib/mapbox-directions";
import { getLegColor, getStablePaletteColorForLocationId } from "@/lib/route-colors";

// Console: WEBGL_debug_renderer_info, texSubImage, and CORS to events.mapbox.com are expected/harmless (see docs/MAPS_IMPLEMENTATION.md).

export interface MapWaypoint {
  lat: number;
  lng: number;
  name?: string;
  /** `trip_locations.id` when the waypoint comes from the trip route (for clicks / selection). */
  id?: string;
  /** When set, map marker uses this #RRGGBB instead of the route palette. */
  markerColor?: string;
  /** Square itinerary marker: show this image inside the marker when set. */
  thumbnailUrl?: string | null;
  /** 1-based order badge (e.g. stop number on the route). */
  orderIndex?: number;
  /** Single letter when there is no thumbnail (e.g. first letter of the place name). */
  markerLetter?: string;
}

const DEFAULT_CENTER = { longitude: 23.32, latitude: 42.7 };
const DEFAULT_ZOOM = 3;
// Use a label- and POI-rich basemap so the map never feels empty.
// Standard requires a different SDK; stick to streets-v12 for GL JS.
const MAPBOX_BASE_STYLE = "mapbox://styles/mapbox/streets-v12";
const FOCUS_ZOOM = 14;
const FLY_DURATION_MS = 1200;

/**
 * `resize()` after `requestAnimationFrame` can run after React has unmounted the map
 * (navigation, Strict Mode, preview cards). Mapbox then touches a disposed `_canvas`.
 */
function safeMapResize(map: MapboxMap) {
  try {
    const canvas = map.getCanvas();
    if (!canvas.isConnected) return;
    map.resize();
  } catch (cause) {
    if (process.env.NODE_ENV === "development") {
      console.debug("[MapView] resize skipped (map not ready or disposed)", cause);
    }
  }
}

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

function MapZoomControls({
  zoomInLabel,
  zoomOutLabel,
}: {
  zoomInLabel: string;
  zoomOutLabel: string;
}) {
  const { current: map } = useMap();
  return (
    <div className="pointer-events-auto absolute right-3 top-3 z-10 flex flex-col overflow-hidden rounded-xl border border-white/25 bg-black/55 shadow-lg backdrop-blur-md">
      <button
        type="button"
        className="flex h-10 w-10 items-center justify-center text-lg font-medium leading-none text-white/95 transition hover:bg-white/10 active:bg-white/15"
        aria-label={zoomInLabel}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          map?.zoomIn({ duration: 220 });
        }}
      >
        +
      </button>
      <div className="h-px shrink-0 bg-white/15" />
      <button
        type="button"
        className="flex h-10 w-10 items-center justify-center text-lg font-medium leading-none text-white/95 transition hover:bg-white/10 active:bg-white/15"
        aria-label={zoomOutLabel}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          map?.zoomOut({ duration: 220 });
        }}
      >
        −
      </button>
    </div>
  );
}

function SquareMapMarker({
  fill,
  isSelected,
  letter,
  orderBadge,
  showOrderBadge,
  thumbnailUrl,
  title,
}: {
  fill: string;
  isSelected: boolean;
  letter: string;
  orderBadge: number;
  showOrderBadge: boolean;
  thumbnailUrl: string | null;
  title?: string;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const showImage = Boolean(thumbnailUrl) && !imgFailed;

  useEffect(() => {
    setImgFailed(false);
  }, [thumbnailUrl]);

  return (
    <div
      className={`relative h-12 w-12 overflow-hidden rounded-xl border-2 border-white shadow-lg transition-[transform,box-shadow] duration-150 ${
        isSelected ? "scale-105 ring-2 ring-white/95 ring-offset-2 ring-offset-black/40 shadow-[0_6px_20px_rgba(0,0,0,0.45)]" : ""
      }`}
      title={title}
    >
      {showImage ? (
        <img
          src={thumbnailUrl ?? ""}
          alt=""
          className="h-full w-full object-cover"
          onError={() => setImgFailed(true)}
        />
      ) : (
        <div
          className="flex h-full w-full items-center justify-center text-lg font-bold text-white/95"
          style={{ backgroundColor: fill }}
        >
          {letter}
        </div>
      )}
      {showOrderBadge ? (
        <div className="pointer-events-none absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full border border-white/90 bg-white px-1 text-[10px] font-bold leading-none text-neutral-900 shadow-sm">
          {orderBadge > 99 ? "99+" : orderBadge}
        </div>
      ) : null}
    </div>
  );
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
  /** Fill color for the preview marker (defaults to amber). */
  previewMarkerColor?: string | null;
  /** Called when user clicks the map (useful for adding stops by dropping a pin). */
  onMapClick?: ((lngLat: { lng: number; lat: number }) => void) | null;
  /**
   * Called when user activates a route waypoint marker (large touch target; click does not propagate to the map).
   * Only fired when `onWaypointClick` is provided and the waypoint has `id`.
   */
  onWaypointClick?: ((detail: { id: string; index: number; lat: number; lng: number }) => void) | null;
  /** Highlights the waypoint whose `id` matches (ring / scale). */
  selectedWaypointId?: string | null;
  /** Optional callback when map stops moving; used for nearby POIs. */
  onMoveEnd?: ((state: { center: { lng: number; lat: number }; zoom: number }) => void) | null;
  /** Per-leg route geometry from Mapbox Directions; when set, drawn instead of straight segments. */
  routeLineGeo?: RouteLegsGeoJSON | null;
  /** When waypoints is empty, use this center for initial view (e.g. wizard first step). */
  defaultCenter?: { lng: number; lat: number };
  /** When waypoints is empty, use this zoom for initial view. Ignored if defaultCenter not set. */
  defaultZoom?: number;
  /** Optional extra content rendered inside the map (e.g. POI markers). */
  children?: ReactNode;
  /** When true, shows +/- zoom buttons (top-right). */
  showZoomControls?: boolean;
  /** Accessibility labels for zoom buttons (required when showZoomControls is true). */
  zoomInLabel?: string;
  zoomOutLabel?: string;
  /** When "square", route waypoints render as photo/letter squares with optional order badge. */
  waypointMarkerDisplay?: "dot" | "square";
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
  previewMarkerColor = null,
  onMapClick = null,
  onWaypointClick = null,
  selectedWaypointId = null,
  onMoveEnd = null,
  routeLineGeo = null,
  defaultCenter,
  defaultZoom = 10,
  children,
  showZoomControls = false,
  zoomInLabel = "Zoom in",
  zoomOutLabel = "Zoom out",
  waypointMarkerDisplay = "dot",
}: MapViewProps) {
  const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

  const { initialViewState, lineGeo } = useMemo(() => {
    const withCoords = waypoints.filter((w) => Number.isFinite(w.lat) && Number.isFinite(w.lng));
    const bounds = withCoords.length > 0 ? getBounds(withCoords) : null;
    const fallback =
      withCoords.length >= 2
        ? straightLineLegs(withCoords.map((w) => ({ lng: w.lng, lat: w.lat })))
        : null;
    const rawLineGeo = routeLineGeo ?? fallback;
    const lineGeo = recolorRouteGeoByWaypointMarkers(rawLineGeo, withCoords);
    let initialViewState: { longitude: number; latitude: number; zoom: number } | { bounds: [[number, number], [number, number]]; fitBoundsOptions: { padding: number; maxZoom: number } };
    if (fitToRoute && bounds) {
      initialViewState = {
        bounds: bounds as [[number, number], [number, number]],
        fitBoundsOptions: { padding: fitPadding, maxZoom: 14 },
      };
    } else if (withCoords.length === 0 && defaultCenter) {
      initialViewState = {
        longitude: defaultCenter.lng,
        latitude: defaultCenter.lat,
        zoom: defaultZoom,
      };
    } else {
      initialViewState = {
        ...DEFAULT_CENTER,
        zoom: DEFAULT_ZOOM,
      };
    }
    return { initialViewState, lineGeo };
  }, [waypoints, fitToRoute, fitPadding, routeLineGeo, defaultCenter, defaultZoom]);

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
  const paletteIndex = (i: number) =>
    validWaypoints.length <= 1 ? 0 : Math.min(i, Math.max(numLegs - 1, 0));

  return (
    <div className={`relative ${className ?? ""}`} style={{ width: "100%", height: "100%" }}>
      <Map
        mapboxAccessToken={token}
        initialViewState={initialViewState}
        mapStyle={MAPBOX_BASE_STYLE}
        style={{ width: "100%", height: "100%" }}
        interactive={interactive}
        onLoad={(e) => {
          // Re-sync canvas to container after layout (embeds in cards / drawers often start at wrong DPR).
          const map = e.target;
          safeMapResize(map);
          const rafId = requestAnimationFrame(() => safeMapResize(map));
          map.once("remove", () => cancelAnimationFrame(rafId));
        }}
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
        {showZoomControls ? (
          <MapZoomControls zoomInLabel={zoomInLabel} zoomOutLabel={zoomOutLabel} />
        ) : null}
      {previewLngLat && (
        <Marker
          longitude={previewLngLat.lng}
          latitude={previewLngLat.lat}
          anchor="bottom"
        >
          <div
            className="h-8 w-8 rounded-full border-2 border-white shadow-lg"
            style={{
              backgroundColor: previewMarkerColor ?? "#fbbf24",
              boxShadow: previewMarkerColor
                ? `0 0 0 4px ${previewMarkerColor}33`
                : "0 0 0 4px rgba(251, 191, 36, 0.35)",
            }}
          />
        </Marker>
      )}
      {lineGeo && (
        <Source id="route-line" type="geojson" data={lineGeo}>
          <Layer id="route-line-layer" type="line" paint={LINE_PAINT} layout={LINE_LAYOUT} />
        </Source>
      )}
      {validWaypoints.map((w, i) => {
        const isSelected = w.id != null && w.id === selectedWaypointId;
        const canActivateWaypoint = Boolean(onWaypointClick && w.id);
        const fill = w.markerColor ?? (w.id ? getStablePaletteColorForLocationId(w.id) : getLegColor(paletteIndex(i)));
        const useSquare = waypointMarkerDisplay === "square";
        const showOrderBadge =
          typeof w.orderIndex === "number" && Number.isFinite(w.orderIndex) && w.orderIndex > 0;
        const orderBadge =
          showOrderBadge && typeof w.orderIndex === "number" && Number.isFinite(w.orderIndex)
            ? Math.floor(w.orderIndex)
            : i + 1;
        const letter = (w.markerLetter ?? w.name ?? "?").trim().charAt(0).toUpperCase() || "?";
        const thumb = typeof w.thumbnailUrl === "string" && w.thumbnailUrl.trim().length > 0 ? w.thumbnailUrl.trim() : null;

        const squareMarker = (
          <SquareMapMarker
            fill={fill}
            isSelected={isSelected}
            letter={letter}
            orderBadge={orderBadge}
            showOrderBadge={showOrderBadge}
            thumbnailUrl={thumb}
            title={w.name}
          />
        );

        const dot = (
          <div
            className="h-6 w-6 rounded-full border-2 border-white shadow-lg transition-[transform,box-shadow] duration-150"
            style={{
              backgroundColor: fill,
              transform: isSelected ? "scale(1.08)" : undefined,
              boxShadow: isSelected
                ? "0 0 0 2px rgba(255,255,255,0.95), 0 0 14px 3px rgba(255,255,255,0.35), 0 6px 16px rgba(0,0,0,0.35)"
                : undefined,
            }}
            title={w.name}
          />
        );

        const markerBody = useSquare ? squareMarker : dot;

        return (
          <Marker
            key={w.id ?? `${w.lng}-${w.lat}-${i}`}
            longitude={w.lng}
            latitude={w.lat}
            anchor="bottom"
          >
            {canActivateWaypoint ? (
              <button
                type="button"
                className={`flex touch-manipulation items-end justify-center ${useSquare ? "min-h-[52px] min-w-[52px] pb-0.5" : "min-h-11 min-w-11 pb-0.5"}`}
                aria-label={w.name ?? `Route stop ${i + 1}`}
                aria-pressed={isSelected}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (w.id) {
                    onWaypointClick?.({ id: w.id, index: i, lat: w.lat, lng: w.lng });
                  }
                }}
              >
                {markerBody}
              </button>
            ) : (
              markerBody
            )}
          </Marker>
        );
      })}
      {children}
      </Map>
    </div>
  );
}
