/**
 * Shared weather types for provider integrations.
 */
export interface OpenMeteoForecastResponse {
  latitude: number;
  longitude: number;
  current?: {
    time: string;
    temperature_2m?: number;
    relative_humidity_2m?: number;
    apparent_temperature?: number;
    weather_code?: number;
    wind_speed_10m?: number;
    wind_direction_10m?: number;
    cloud_cover?: number;
  };
  daily?: {
    time: string[];
    weather_code?: number[];
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
    precipitation_probability_max?: number[];
    precipitation_sum?: number[];
    wind_speed_10m_max?: number[];
    cloud_cover_mean?: number[];
    uv_index_max?: number[];
  };
}

export interface OpenMeteoGeocodingResponse {
  results?: Array<{
    name: string;
    latitude: number;
    longitude: number;
    country?: string;
    admin1?: string;
  }>;
}

/**
 * Simplified weather data for frontend use
 */
export interface WeatherData {
  location: string;
  current?: {
    temperature: number;
    temperatureApparent: number;
    humidity: number;
    weatherCode: number;
    description: string;
    windSpeed: number;
    windDirection: number;
    cloudCover: number;
    uvIndex?: number;
  };
  forecast?: Array<{
    date: string;
    temperatureMin?: number;
    temperatureMax?: number;
    temperature?: number;
    humidity: number;
    precipitationProbability: number;
    precipitationIntensity: number;
    weatherCode: number;
    description: string;
    windSpeed: number;
    cloudCover: number;
  }>;
}

/**
 * App weather descriptions keyed by WMO weather codes.
 * Source: Open-Meteo / WMO weather interpretation codes.
 */
export const WEATHER_CODE_DESCRIPTIONS: Record<number, string> = {
  // Open-Meteo WMO codes
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Depositing rime fog',
  51: 'Light drizzle',
  53: 'Moderate drizzle',
  55: 'Dense drizzle',
  56: 'Light freezing drizzle',
  57: 'Dense freezing drizzle',
  61: 'Slight rain',
  63: 'Moderate rain',
  65: 'Heavy rain',
  66: 'Light freezing rain',
  67: 'Heavy freezing rain',
  71: 'Slight snow fall',
  73: 'Moderate snow fall',
  75: 'Heavy snow fall',
  77: 'Snow grains',
  80: 'Slight rain showers',
  81: 'Moderate rain showers',
  82: 'Violent rain showers',
  85: 'Slight snow showers',
  86: 'Heavy snow showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with slight hail',
  99: 'Thunderstorm with heavy hail',
};

/**
 * Get weather description from code
 */
export function getWeatherDescription(code: number): string {
  return WEATHER_CODE_DESCRIPTIONS[code] || 'Cloudy';
}

/**
 * Weather data mapped to a specific trip location
 */
export interface TripLocationWeather {
  locationId: string;
  locationName: string;
  orderIndex?: number;
  arrivalDate?: string | null;
  departureDate?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  weather?: WeatherData | null;
  error?: string | null;
}

/**
 * Weather response for an entire trip
 */
export interface TripWeatherResponse {
  tripId: string;
  locations: TripLocationWeather[];
}

