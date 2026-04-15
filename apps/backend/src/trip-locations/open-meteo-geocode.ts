/**
 * Resolve a free-text place name to coordinates using Open-Meteo geocoding (no API key).
 * Same provider pattern as {@link WeatherService} for consistency.
 */

type OpenMeteoGeocodeHit = {
  name?: string;
  latitude: number;
  longitude: number;
};

type OpenMeteoGeocodeResponse = {
  results?: OpenMeteoGeocodeHit[];
};

const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';

export class GeocodePlaceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GeocodePlaceError';
  }
}

export async function geocodePlaceNameOrThrow(
  locationName: string,
): Promise<{ latitude: number; longitude: number }> {
  const query = locationName.trim();
  if (query.length < 2) {
    throw new GeocodePlaceError('Location name is too short to geocode.');
  }

  const url = new URL(GEOCODING_URL);
  url.searchParams.set('name', query);
  url.searchParams.set('count', '5');
  url.searchParams.set('language', 'en');

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new GeocodePlaceError(`Geocoding request failed (${res.status}).`);
  }

  const body = (await res.json()) as OpenMeteoGeocodeResponse;
  const hit = body.results?.[0];
  if (!hit || typeof hit.latitude !== 'number' || typeof hit.longitude !== 'number') {
    throw new GeocodePlaceError(
      `No coordinates found for "${query}". Try a fuller name (e.g. "Plovdiv, Bulgaria").`,
    );
  }

  return { latitude: hit.latitude, longitude: hit.longitude };
}
