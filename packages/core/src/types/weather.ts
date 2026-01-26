/**
 * Weather types for Tomorrow.io API integration
 */

/**
 * Tomorrow.io Timeline API response structure
 */
export interface TomorrowTimelineResponse {
  data: {
    timelines: Array<{
      timestep: string;
      intervals: Array<{
        startTime: string;
        values: {
          temperature?: number;
          temperatureMin?: number;
          temperatureMax?: number;
          temperatureApparent?: number;
          humidity?: number;
          precipitationProbability?: number;
          precipitationIntensity?: number;
          weatherCode?: number;
          windSpeed?: number;
          windDirection?: number;
          cloudCover?: number;
          visibility?: number;
          uvIndex?: number;
        };
      }>;
    }>;
  };
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
 * Weather code to description mapping
 * Based on Tomorrow.io weather codes
 */
export const WEATHER_CODE_DESCRIPTIONS: Record<number, string> = {
  1000: 'Clear, Sunny',
  1100: 'Mostly Clear',
  1101: 'Partly Cloudy',
  1102: 'Mostly Cloudy',
  1001: 'Cloudy',
  2000: 'Fog',
  2100: 'Light Fog',
  4000: 'Drizzle',
  4001: 'Rain',
  4200: 'Light Rain',
  4201: 'Heavy Rain',
  5000: 'Snow',
  5001: 'Flurries',
  5100: 'Light Snow',
  5101: 'Heavy Snow',
  6000: 'Freezing Drizzle',
  6001: 'Freezing Rain',
  6200: 'Light Freezing Rain',
  6201: 'Heavy Freezing Rain',
  7000: 'Ice Pellets',
  7101: 'Heavy Ice Pellets',
  7102: 'Light Ice Pellets',
  8000: 'Thunderstorm',
};

/**
 * Get weather description from code
 */
export function getWeatherDescription(code: number): string {
  return WEATHER_CODE_DESCRIPTIONS[code] || 'Unknown';
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

