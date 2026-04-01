import type { TripLocation } from "@gotrippin/core";
import { isSolidRouteColor } from "@/lib/route-colors";
import type { MapWaypoint } from "./MapView";

/**
 * Converts trip locations that have coordinates to map waypoints.
 * Locations without lat/lng are omitted so the map can still show others.
 */
export function tripLocationsToWaypoints(locations: TripLocation[]): MapWaypoint[] {
  return locations
    .filter(
      (loc) =>
        loc.latitude != null &&
        loc.longitude != null &&
        Number.isFinite(loc.latitude) &&
        Number.isFinite(loc.longitude)
    )
    .map((loc) => ({
      id: loc.id,
      lat: loc.latitude as number,
      lng: loc.longitude as number,
      name: loc.location_name,
      markerColor:
        loc.marker_color != null && isSolidRouteColor(loc.marker_color)
          ? loc.marker_color
          : undefined,
    }));
}
