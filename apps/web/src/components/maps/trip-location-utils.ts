import type { TripLocation } from "@gotrippin/core";
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
      lat: loc.latitude as number,
      lng: loc.longitude as number,
      name: loc.location_name,
    }));
}
