/**
 * Fetches road route geometry from Mapbox Directions API (v5).
 * Returns a GeoJSON Feature<LineString> suitable for Mapbox GL line layers,
 * or null if the request fails or no route is found.
 */

const DIRECTIONS_BASE = "https://api.mapbox.com/directions/v5";
const DEFAULT_PROFILE = "mapbox/driving";
const MAX_WAYPOINTS = 25;

export type RouteProfile = "mapbox/driving" | "mapbox/driving-traffic" | "mapbox/walking" | "mapbox/cycling";

export interface RouteWaypoint {
  lng: number;
  lat: number;
}

/** GeoJSON Feature with LineString geometry for Mapbox Source type="geojson" */
export interface RouteLineFeature {
  type: "Feature";
  properties: Record<string, unknown>;
  geometry: {
    type: "LineString";
    coordinates: [number, number][];
  };
}

interface MapboxDirectionsResponse {
  code?: string;
  routes?: Array<{
    geometry?: {
      type: "LineString";
      coordinates: [number, number][];
    };
  }>;
}

/**
 * Fetches the shortest/fastest road route through the given waypoints and returns
 * the route geometry as a GeoJSON Feature<LineString>. Uses overview=full and
 * geometries=geojson for full road detail. Optional signal aborts the request.
 */
export async function fetchRoute(
  waypoints: RouteWaypoint[],
  accessToken: string,
  profile: RouteProfile = DEFAULT_PROFILE,
  signal?: AbortSignal
): Promise<RouteLineFeature | null> {
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
  if (!geometry || geometry.type !== "LineString" || !Array.isArray(geometry.coordinates) || geometry.coordinates.length < 2) {
    return null;
  }

  return {
    type: "Feature",
    properties: {},
    geometry: {
      type: "LineString",
      coordinates: geometry.coordinates,
    },
  };
}
