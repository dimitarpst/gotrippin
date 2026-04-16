export interface GooglePlaceResult {
  id: string;
  name: string;
  address?: string;
  lat: number;
  lng: number;
  primaryType?: string;
}

interface NewPlacesLocation {
  latitude: number;
  longitude: number;
}

interface NewPlacesDisplayName {
  text: string;
}

interface NewPlacesPlace {
  id: string;
  formattedAddress?: string;
  location?: NewPlacesLocation;
  displayName?: NewPlacesDisplayName;
  primaryType?: string;
}

interface NewPlacesSearchResponse {
  places?: NewPlacesPlace[];
}

interface NearbySearchRequest {
  location: { lat: number; lng: number };
  radiusMeters: number;
  includedTypes?: string[];
  maxResultCount?: number;
}

interface NearbySearchResponse {
  places?: NewPlacesPlace[];
}

function ensureApiKey(): string {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    throw new Error("Google Places API key is not configured");
  }
  return apiKey;
}

export async function searchPlaces(
  query: string,
  location?: { lat: number; lng: number },
): Promise<GooglePlaceResult[]> {
  const apiKey = ensureApiKey();

  const fieldMask = [
    "places.id",
    "places.displayName",
    "places.formattedAddress",
    "places.location",
    "places.primaryType",
  ].join(",");

  const body: { textQuery: string; locationBias?: { circle: { center: NewPlacesLocation; radius: number } } } = {
    textQuery: query,
  };

  if (location) {
    body.locationBias = {
      circle: {
        center: {
          latitude: location.lat,
          longitude: location.lng,
        },
        radius: 5000,
      },
    };
  }

  const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": fieldMask,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Google Places request failed with status ${response.status}`);
  }

  const data: NewPlacesSearchResponse = await response.json();
  const places = data.places ?? [];

  return places
    .filter((place) => place.location && place.displayName)
    .map((place) => ({
      id: place.id,
      name: place.displayName ? place.displayName.text : "",
      address: place.formattedAddress,
      lat: place.location ? place.location.latitude : 0,
      lng: place.location ? place.location.longitude : 0,
      primaryType: place.primaryType,
    }));
}

export async function searchNearbyPlaces(
  req: NearbySearchRequest,
): Promise<GooglePlaceResult[]> {
  const apiKey = ensureApiKey();

  const fieldMask = [
    "places.id",
    "places.displayName",
    "places.formattedAddress",
    "places.location",
    "places.primaryType",
  ].join(",");

  const body: {
    includedTypes?: string[];
    maxResultCount?: number;
    locationRestriction: { circle: { center: NewPlacesLocation; radius: number } };
  } = {
    locationRestriction: {
      circle: {
        center: {
          latitude: req.location.lat,
          longitude: req.location.lng,
        },
        radius: req.radiusMeters,
      },
    },
  };

  if (req.includedTypes && req.includedTypes.length > 0) {
    body.includedTypes = req.includedTypes;
  }
  if (req.maxResultCount) {
    body.maxResultCount = req.maxResultCount;
  }

  const response = await fetch("https://places.googleapis.com/v1/places:searchNearby", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": fieldMask,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Google Places nearby request failed with status ${response.status}`);
  }

  const data: NearbySearchResponse = await response.json();
  const places = data.places ?? [];

  return places
    .filter((place) => place.location && place.displayName)
    .map((place) => ({
      id: place.id,
      name: place.displayName ? place.displayName.text : "",
      address: place.formattedAddress,
      lat: place.location ? place.location.latitude : 0,
      lng: place.location ? place.location.longitude : 0,
      primaryType: place.primaryType,
    }));
}

/** Client merge fields for AI place cards (from Place Details). */
export interface GooglePlaceEnrichment {
  address?: string | null;
  rating?: number | null;
  rating_count?: number | null;
  photo_url?: string | null;
  /** Official photo URLs after the first (carousel). */
  extra_photo_urls?: string[] | null;
  phone_number?: string | null;
  website?: string | null;
  weekday_hours?: string[] | null;
  place_type?: string | null;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/**
 * Normalizes a Places resource or legacy id to the id segment used in
 * `GET https://places.googleapis.com/v1/places/{placeId}`.
 */
export function normalizePlacesApiPlaceId(raw: string | null | undefined): string | null {
  if (raw == null) return null;
  const s = raw.trim();
  if (!s) return null;
  if (s.startsWith("places/")) {
    const withoutPrefix = s.slice("places/".length);
    const firstSegment = withoutPrefix.split("/")[0];
    return firstSegment != null && firstSegment.length > 0 ? firstSegment : null;
  }
  return s;
}

/**
 * Heuristic guard before Place Details (New): model output often truncates ids
 * (e.g. 24 chars), which yields HTTP 400 and noisy devtools requests.
 */
export function isLikelyValidGooglePlaceIdForDetailsRequest(
  placeIdSegment: string | null | undefined,
): placeIdSegment is string {
  if (placeIdSegment == null) return false;
  const s = placeIdSegment.trim();
  if (s.length < 25 || s.length > 256) return false;
  return /^[A-Za-z0-9_-]+$/.test(s);
}

export function buildPlacePhotoMediaUrl(
  photoResourceName: string,
  apiKey: string,
  maxHeightPx: number,
): string {
  return `https://places.googleapis.com/v1/${photoResourceName}/media?maxHeightPx=${maxHeightPx}&key=${encodeURIComponent(apiKey)}`;
}

function mapPlaceDetailsJsonToEnrichment(raw: unknown, apiKey: string): GooglePlaceEnrichment | null {
  if (!isRecord(raw)) return null;
  const out: GooglePlaceEnrichment = {};

  const formattedAddress = raw["formattedAddress"];
  if (typeof formattedAddress === "string" && formattedAddress.trim().length > 0) {
    out.address = formattedAddress.trim();
  }

  const rating = raw["rating"];
  if (typeof rating === "number" && Number.isFinite(rating)) {
    out.rating = rating;
  }

  const userRatingCount = raw["userRatingCount"];
  if (typeof userRatingCount === "number" && Number.isFinite(userRatingCount) && userRatingCount >= 0) {
    out.rating_count = Math.floor(userRatingCount);
  }

  const phone = raw["internationalPhoneNumber"];
  if (typeof phone === "string" && phone.trim().length > 0) {
    out.phone_number = phone.trim();
  }

  const websiteUri = raw["websiteUri"];
  if (typeof websiteUri === "string" && websiteUri.trim().length > 0) {
    out.website = websiteUri.trim();
  }

  const primaryType = raw["primaryType"];
  if (typeof primaryType === "string" && primaryType.trim().length > 0) {
    out.place_type = primaryType.trim();
  }

  const hours = raw["regularOpeningHours"];
  if (isRecord(hours)) {
    const wd = hours["weekdayDescriptions"];
    if (Array.isArray(wd)) {
      const lines: string[] = [];
      for (const line of wd) {
        if (typeof line === "string" && line.trim().length > 0) lines.push(line.trim());
      }
      if (lines.length > 0) out.weekday_hours = lines;
    }
  }

  const photosRaw = raw["photos"];
  const photoUrls: string[] = [];
  if (Array.isArray(photosRaw)) {
    for (const ph of photosRaw) {
      if (!isRecord(ph)) continue;
      const name = ph["name"];
      if (typeof name !== "string" || !name.trim()) continue;
      photoUrls.push(buildPlacePhotoMediaUrl(name.trim(), apiKey, 900));
      if (photoUrls.length >= 10) break;
    }
  }
  if (photoUrls.length > 0) {
    const first = photoUrls[0];
    if (first != null) out.photo_url = first;
    if (photoUrls.length > 1) {
      out.extra_photo_urls = photoUrls.slice(1);
    }
  }

  return Object.keys(out).length > 0 ? out : null;
}

/**
 * Fetches Place Details (New) for enrichment. Returns null when the key is missing,
 * the id is invalid, or the response cannot be mapped.
 */
export async function fetchPlaceDetailsForEnrichment(
  placeIdRaw: string,
): Promise<GooglePlaceEnrichment | null> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY?.trim();
  if (!apiKey) return null;

  const placeId = normalizePlacesApiPlaceId(placeIdRaw);
  if (!placeId) return null;
  if (!isLikelyValidGooglePlaceIdForDetailsRequest(placeId)) return null;

  const fieldMask = [
    "formattedAddress",
    "rating",
    "userRatingCount",
    "internationalPhoneNumber",
    "websiteUri",
    "regularOpeningHours.weekdayDescriptions",
    "photos",
    "primaryType",
  ].join(",");

  const url = `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": fieldMask,
    },
  });

  if (!response.ok) {
    return null;
  }

  let raw: unknown;
  try {
    raw = await response.json();
  } catch {
    return null;
  }

  return mapPlaceDetailsJsonToEnrichment(raw, apiKey);
}

