/**
 * Client-side Google Maps deep links (no API key).
 */

type LatLngLike = {
  lat?: number | null;
  lng?: number | null;
  latitude?: number | null;
  longitude?: number | null;
};

/** Multi-stop directions in Google Maps; needs at least two finite coordinates. */
export function buildGoogleMapsMultiStopDirectionsUrl(stops: ReadonlyArray<LatLngLike>): string | null {
  const finite: { lat: number; lng: number }[] = [];
  for (const s of stops) {
    const lat = s.latitude ?? s.lat;
    const lng = s.longitude ?? s.lng;
    if (typeof lat !== "number" || typeof lng !== "number") continue;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    finite.push({ lat, lng });
  }
  if (finite.length < 2) return null;
  return `https://www.google.com/maps/dir/${finite.map((p) => `${p.lat},${p.lng}`).join("/")}`;
}

/** Open this stop in Google Maps (coordinates preferred). */
export function buildGoogleMapsStopSearchUrl(params: {
  lat?: number | null;
  lng?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  name?: string | null;
  address?: string | null;
}): string {
  const lat = params.latitude ?? params.lat;
  const lng = params.longitude ?? params.lng;
  if (typeof lat === "number" && typeof lng === "number") {
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    }
  }
  const q = [params.name, params.address]
    .filter((x): x is string => typeof x === "string" && x.trim().length > 0)
    .map((x) => x.trim())
    .join(", ");
  const fallback = q.length > 0 ? q : "place";
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fallback)}`;
}
