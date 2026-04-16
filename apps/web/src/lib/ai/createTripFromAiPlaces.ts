import type { AiPlaceSuggestion } from "@/lib/api/ai";
import { createTrip, fetchTripById } from "@/lib/api/trips";
import { addLocation, getLocations } from "@/lib/api/trip-locations";
import { normalizePlacesApiPlaceId } from "@/lib/googlePlaces";
import { getLegColor, getRandomRouteColor } from "@/lib/route-colors";

/** Stops that can be persisted as route waypoints (Mapbox / Google need coordinates). */
export function placesWithValidCoords(places: AiPlaceSuggestion[]): AiPlaceSuggestion[] {
  return places.filter(
    (p) =>
      p.latitude != null &&
      p.longitude != null &&
      Number.isFinite(p.latitude) &&
      Number.isFinite(p.longitude),
  );
}

/**
 * Creates a real trip and ordered stops from AI PLACE_CARDS / enriched suggestions.
 * Does not call the LLM — deterministic persistence only.
 */
export async function createTripFromAiPlaces(
  places: AiPlaceSuggestion[],
  token?: string | null,
): Promise<{ id: string; share_code: string }> {
  const withCoords = placesWithValidCoords(places);
  if (withCoords.length === 0) {
    throw new Error("NO_COORDS");
  }

  const first = withCoords[0];
  const titleBase =
    withCoords.length === 1 ? first.name : `${first.name} + ${withCoords.length - 1} stops`;
  const title = titleBase.slice(0, 200);
  const destination = (first.address?.trim() || first.name).slice(0, 200);

  const trip = await createTrip(
    {
      title,
      destination,
      color: getRandomRouteColor(),
    },
    token,
  );

  for (let i = 0; i < withCoords.length; i += 1) {
    const p = withCoords[i];
    const lat = p.latitude as number;
    const lng = p.longitude as number;
    const rawPid = p.place_id?.trim();
    const google_place_id =
      rawPid && rawPid.length > 0 ? normalizePlacesApiPlaceId(rawPid) ?? rawPid : undefined;
    const photoRaw = p.photo_url?.trim();
    const photo_url = photoRaw && photoRaw.length > 0 ? photoRaw : undefined;
    const addrRaw = p.address?.trim();
    const formatted_address = addrRaw && addrRaw.length > 0 ? addrRaw.slice(0, 500) : undefined;

    await addLocation(
      trip.id,
      {
        location_name: p.name.trim().slice(0, 200) || "Stop",
        latitude: lat,
        longitude: lng,
        order_index: i + 1,
        marker_color: getLegColor(i),
        ...(google_place_id != null ? { google_place_id } : {}),
        ...(photo_url != null ? { photo_url } : {}),
        ...(formatted_address != null ? { formatted_address } : {}),
      },
      token,
    );
  }

  return { id: trip.id, share_code: trip.share_code };
}

/**
 * Appends AI itinerary stops to an existing trip (after any current route locations).
 */
export async function addAiPlacesToExistingTrip(
  tripId: string,
  places: AiPlaceSuggestion[],
  token?: string | null,
): Promise<{ id: string; share_code: string }> {
  const withCoords = placesWithValidCoords(places);
  if (withCoords.length === 0) {
    throw new Error("NO_COORDS");
  }

  const existing = await getLocations(tripId, token);
  const maxOrder = existing.reduce((m, loc) => Math.max(m, loc.order_index), 0);
  let nextOrder = maxOrder + 1;

  for (let i = 0; i < withCoords.length; i += 1) {
    const p = withCoords[i];
    const lat = p.latitude as number;
    const lng = p.longitude as number;
    const rawPid = p.place_id?.trim();
    const google_place_id =
      rawPid && rawPid.length > 0 ? normalizePlacesApiPlaceId(rawPid) ?? rawPid : undefined;
    const photoRaw = p.photo_url?.trim();
    const photo_url = photoRaw && photoRaw.length > 0 ? photoRaw : undefined;
    const addrRaw = p.address?.trim();
    const formatted_address = addrRaw && addrRaw.length > 0 ? addrRaw.slice(0, 500) : undefined;
    const legIndex = existing.length + i;

    await addLocation(
      tripId,
      {
        location_name: p.name.trim().slice(0, 200) || "Stop",
        latitude: lat,
        longitude: lng,
        order_index: nextOrder,
        marker_color: getLegColor(legIndex),
        ...(google_place_id != null ? { google_place_id } : {}),
        ...(photo_url != null ? { photo_url } : {}),
        ...(formatted_address != null ? { formatted_address } : {}),
      },
      token,
    );
    nextOrder += 1;
  }

  const trip = await fetchTripById(tripId, token);
  return { id: trip.id, share_code: trip.share_code };
}
