/**
 * Fetches road route geometry from Mapbox Directions API (v5).
 * Returns a FeatureCollection with one Feature per leg (each with its own color),
 * suitable for data-driven line styling in Mapbox GL.
 */

import { getLegColor, getStablePaletteColorForLocationId, isSolidRouteColor } from "@/lib/route-colors";

const DIRECTIONS_BASE = "https://api.mapbox.com/directions/v5";
const DEFAULT_PROFILE = "mapbox/driving";
const MAX_WAYPOINTS = 25;

export type RouteProfile = "mapbox/driving" | "mapbox/driving-traffic" | "mapbox/walking" | "mapbox/cycling";

export interface RouteWaypoint {
  lng: number;
  lat: number;
}

export interface RouteLegFeature {
  type: "Feature";
  properties: { color: string; legIndex: number };
  geometry: {
    type: "LineString";
    coordinates: [number, number][];
  };
}

/** FeatureCollection where each Feature is one route leg with a `color` property. */
export interface RouteLegsGeoJSON {
  type: "FeatureCollection";
  features: RouteLegFeature[];
}

interface MapboxDirectionsResponse {
  code?: string;
  routes?: Array<{
    geometry?: {
      type: "LineString";
      coordinates: [number, number][];
    };
  }>;
  waypoints?: Array<{
    location: [number, number];
  }>;
}

/**
 * Splits a full-route coordinate array into legs at the snapped waypoint positions.
 * Walks the coordinate array and, for each interior waypoint, finds the closest
 * coordinate index (searching forward only so legs stay in order).
 */
function splitAtWaypoints(
  coordinates: [number, number][],
  waypointLocations: [number, number][]
): [number, number][][] {
  if (waypointLocations.length < 2 || coordinates.length < 2) {
    return [coordinates];
  }

  const splitIndices: number[] = [];
  let searchFrom = 1;

  for (let w = 1; w < waypointLocations.length - 1; w++) {
    const [wpLng, wpLat] = waypointLocations[w];
    let bestIdx = searchFrom;
    let bestDist = Infinity;

    for (let i = searchFrom; i < coordinates.length - 1; i++) {
      const dist =
        (coordinates[i][0] - wpLng) ** 2 + (coordinates[i][1] - wpLat) ** 2;
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = i;
      }
    }

    splitIndices.push(bestIdx);
    searchFrom = bestIdx + 1;
  }

  const legs: [number, number][][] = [];
  let start = 0;

  for (const splitIdx of splitIndices) {
    legs.push(coordinates.slice(start, splitIdx + 1));
    start = splitIdx;
  }
  legs.push(coordinates.slice(start));

  return legs.filter((leg) => leg.length >= 2);
}

function legsToFeatureCollection(legs: [number, number][][]): RouteLegsGeoJSON {
  return {
    type: "FeatureCollection",
    features: legs.map((coords, i) => ({
      type: "Feature" as const,
      properties: { color: getLegColor(i), legIndex: i },
      geometry: { type: "LineString" as const, coordinates: coords },
    })),
  };
}

/**
 * Fetches the road route through the given waypoints and returns a FeatureCollection
 * with one Feature per leg, each colored from the palette.
 */
export async function fetchRoute(
  waypoints: RouteWaypoint[],
  accessToken: string,
  profile: RouteProfile = DEFAULT_PROFILE,
  signal?: AbortSignal
): Promise<RouteLegsGeoJSON | null> {
  const withCoords = waypoints.filter(
    (w) => Number.isFinite(w.lat) && Number.isFinite(w.lng)
  );
  if (withCoords.length < 2 || withCoords.length > MAX_WAYPOINTS) {
    return null;
  }

  const coords = withCoords.map((w) => `${w.lng},${w.lat}`).join(";");
  const url = new URL(`${DIRECTIONS_BASE}/${profile}/${encodeURIComponent(coords)}`);
  url.searchParams.set("access_token", accessToken);
  url.searchParams.set("geometries", "geojson");
  url.searchParams.set("overview", "full");

  const res = await fetch(url.toString(), { signal });
  if (!res.ok) {
    console.error("Mapbox Directions request failed", res.status, await res.text());
    return null;
  }

  const data = (await res.json()) as MapboxDirectionsResponse;
  if (data.code !== "Ok" || !data.routes?.length) {
    return null;
  }

  const geometry = data.routes[0].geometry;
  if (
    !geometry ||
    geometry.type !== "LineString" ||
    !Array.isArray(geometry.coordinates) ||
    geometry.coordinates.length < 2
  ) {
    return null;
  }

  const waypointLocations = data.waypoints?.map((w) => w.location) ?? [];
  const legs = splitAtWaypoints(geometry.coordinates, waypointLocations);

  if (legs.length === 0) {
    return null;
  }

  return legsToFeatureCollection(legs);
}

/**
 * Reassigns each leg's `properties.color` from waypoint marker colors (destination,
 * then origin, then route palette). Expects `features.length === waypointsWithCoords - 1`.
 */
export function recolorRouteGeoByWaypointMarkers(
  geo: RouteLegsGeoJSON | null,
  waypoints: Array<{ id?: string; lat: number; lng: number; markerColor?: string }>
): RouteLegsGeoJSON | null {
  if (!geo?.features.length) return geo;
  const withCoords = waypoints.filter(
    (w) => Number.isFinite(w.lat) && Number.isFinite(w.lng)
  );
  const numLegs = withCoords.length - 1;
  if (numLegs < 1 || geo.features.length !== numLegs) return geo;

  const legPaletteIndex = (legIdx: number) =>
    withCoords.length <= 1 ? 0 : Math.min(legIdx, Math.max(numLegs - 1, 0));

  return {
    type: "FeatureCollection",
    features: geo.features.map((feature, i) => {
      const from = withCoords[i];
      const to = withCoords[i + 1];
      const dest =
        to.markerColor != null && isSolidRouteColor(to.markerColor) ? to.markerColor : undefined;
      const src =
        from.markerColor != null && isSolidRouteColor(from.markerColor) ? from.markerColor : undefined;
      const stableTo = to.id != null ? getStablePaletteColorForLocationId(to.id) : undefined;
      const stableFrom = from.id != null ? getStablePaletteColorForLocationId(from.id) : undefined;
      const color = dest ?? src ?? stableTo ?? stableFrom ?? getLegColor(legPaletteIndex(i));
      return {
        ...feature,
        properties: { ...feature.properties, color, legIndex: i },
      };
    }),
  };
}

/** Builds a straight-line FeatureCollection (fallback when Directions hasn't loaded). */
export function straightLineLegs(waypoints: RouteWaypoint[]): RouteLegsGeoJSON {
  const features: RouteLegFeature[] = [];
  for (let i = 0; i < waypoints.length - 1; i++) {
    features.push({
      type: "Feature",
      properties: { color: getLegColor(i), legIndex: i },
      geometry: {
        type: "LineString",
        coordinates: [
          [waypoints[i].lng, waypoints[i].lat],
          [waypoints[i + 1].lng, waypoints[i + 1].lat],
        ],
      },
    });
  }
  return { type: "FeatureCollection", features };
}
