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


