import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import type {
  WeatherData,
  TripWeatherResponse,
  TripLocationWeather,
} from '@gotrippin/core';
import { getWeatherDescription } from '@gotrippin/core';
import { TripLocationsService } from '../trip-locations/trip-locations.service';

interface OpenMeteoForecastResponse {
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

interface OpenMeteoGeocodingResponse {
  results?: Array<{
    name: string;
    latitude: number;
    longitude: number;
    country?: string;
    admin1?: string;
  }>;
}

interface CacheEntry {
  data: WeatherData;
  timestamp: number;
}

@Injectable()
export class WeatherService {
  private readonly logger = new Logger(WeatherService.name);
  private readonly forecastBaseUrl = 'https://api.open-meteo.com/v1/forecast';
  private readonly geocodingBaseUrl = 'https://geocoding-api.open-meteo.com/v1/search';
  private readonly cache = new Map<string, CacheEntry>();
  private readonly cacheTTL = 10 * 60 * 1000; // 10 minutes
  private readonly maxForecastDays = 14;
  private readonly maxRetries = 2;
  private readonly requestTimeoutMs = 6000;
  private readonly minRequestIntervalMs = 150;
  private lastRequestAt = 0;

  constructor(
    private readonly httpService: HttpService,
    private readonly tripLocationsService: TripLocationsService,
  ) {}

  /**
   * Get weather for all trip locations
   */
  async getTripWeather(
    tripId: string,
    userId: string,
    options?: { days?: number },
  ): Promise<TripWeatherResponse> {
    const locations = await this.tripLocationsService.getRoute(tripId, userId);
    const limitDays =
      options?.days && Number.isFinite(options.days) && options.days > 0
        ? Math.min(options.days, this.maxForecastDays)
        : undefined;

    const results: TripLocationWeather[] = await Promise.all(
      locations.map(async (loc) => {
        const target =
          loc.latitude !== null && loc.latitude !== undefined && loc.longitude !== null && loc.longitude !== undefined
            ? `${loc.latitude},${loc.longitude}`
            : loc.location_name;

        // Date window rules:
        // - If both dates exist, end must be strictly after start.
        // - Forecast window is capped to maxForecastDays.
        const nowIso = new Date().toISOString();
        let normalizedStart = this.normalizeStartDate(loc.arrival_date);
        let normalizedEnd = this.normalizeEndDate(loc.departure_date, normalizedStart);

        if (!normalizedStart && loc.departure_date) {
          const endFromDeparture = this.normalizeEndDate(loc.departure_date, nowIso);
          if (endFromDeparture) {
            normalizedStart = nowIso;
            normalizedEnd = endFromDeparture;
          } else {
            normalizedEnd = undefined;
          }
        } else if (!normalizedStart && normalizedEnd) {
          normalizedEnd = undefined;
        }

        // Ensure endTime is strictly after startTime (and clamp to maxForecastDays window)
        if (normalizedStart && normalizedEnd) {
          const startMs = Date.parse(normalizedStart);
          const endMs = Date.parse(normalizedEnd);
          if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) {
            normalizedEnd = undefined;
          } else {
            const maxWindowMs = this.maxForecastDays * 24 * 60 * 60 * 1000;
            if (endMs - startMs > maxWindowMs) {
              normalizedEnd = new Date(startMs + maxWindowMs).toISOString();
            }
          }
        }

        try {
          const weather = await this.getWeatherTimeline(
            target,
            normalizedStart,
            normalizedEnd,
          );

          const trimmedForecast =
            limitDays && weather.forecast
              ? weather.forecast.slice(0, limitDays)
              : weather.forecast;

          return {
            locationId: loc.id,
            locationName: loc.location_name,
            orderIndex: loc.order_index,
            arrivalDate: loc.arrival_date,
            departureDate: loc.departure_date,
            latitude: loc.latitude ?? null,
            longitude: loc.longitude ?? null,
            weather: { ...weather, forecast: trimmedForecast },
            error: null,
          };
        } catch (error: any) {
          this.logger.warn(`Weather fetch failed for location ${loc.id}`, {
            message: error?.message,
          });
          return {
            locationId: loc.id,
            locationName: loc.location_name,
            orderIndex: loc.order_index,
            arrivalDate: loc.arrival_date,
            departureDate: loc.departure_date,
            latitude: loc.latitude ?? null,
            longitude: loc.longitude ?? null,
            weather: null,
            error:
              error?.message ||
              'Failed to fetch weather for this stop',
          };
        }
      }),
    );

    return {
      tripId,
      locations: results,
    };
  }

  /**
   * Get weather timeline (forecast) for a location and date range
   */
  async getWeatherTimeline(
    location: string,
    startDate?: string,
    endDate?: string,
  ): Promise<WeatherData> {
    const cacheKey = `timeline:${location}:${startDate || 'none'}:${endDate || 'none'}`;
    
    // Check cache
    const cached = this.getCachedData(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const coordinates = await this.resolveCoordinates(location);
      const params = this.buildForecastParams(coordinates.latitude, coordinates.longitude, startDate, endDate);
      const response = await this.requestWithRetry<OpenMeteoForecastResponse>(
        this.forecastBaseUrl,
        params,
      );
      const weatherData = this.transformForecastResponse(response, location);
      // Cache the result
      this.setCachedData(cacheKey, weatherData);
      return weatherData;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to fetch weather data',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get realtime (current) weather for a location
   */
  async getRealtimeWeather(location: string): Promise<WeatherData> {
    const cacheKey = `realtime:${location}`;
    
    // Check cache
    const cached = this.getCachedData(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const coordinates = await this.resolveCoordinates(location);
      const params = this.buildForecastParams(
        coordinates.latitude,
        coordinates.longitude,
      );
      const response = await this.requestWithRetry<OpenMeteoForecastResponse>(
        this.forecastBaseUrl,
        params,
      );
      const weatherData = this.transformRealtimeResponse(response, location);
      // Cache the result
      this.setCachedData(cacheKey, weatherData);
      return weatherData;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to fetch weather data',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Transform Open-Meteo forecast response to simplified WeatherData.
   */
  private transformForecastResponse(
    response: OpenMeteoForecastResponse,
    location: string,
  ): WeatherData {
    const weatherData: WeatherData = {
      location,
      forecast: [],
    };

    if (response.daily?.time && response.daily.time.length > 0) {
      weatherData.forecast = response.daily.time.map((date, index) => {
        const temperatureMin = response.daily?.temperature_2m_min?.[index];
        const temperatureMax = response.daily?.temperature_2m_max?.[index];
        const averageTemperature =
          temperatureMin !== undefined && temperatureMax !== undefined
            ? (temperatureMin + temperatureMax) / 2
            : temperatureMax ?? temperatureMin ?? 0;
        const precipitationProbability =
          response.daily?.precipitation_probability_max?.[index] ?? 0;
        const precipitationIntensity =
          response.daily?.precipitation_sum?.[index] ?? 0;
        const weatherCode = response.daily?.weather_code?.[index] ?? 0;
        const windSpeed = response.daily?.wind_speed_10m_max?.[index] ?? 0;
        const cloudCover = response.daily?.cloud_cover_mean?.[index] ?? 0;

        return {
          date,
          temperatureMin,
          temperatureMax,
          temperature: averageTemperature,
          humidity: 0,
          precipitationProbability,
          precipitationIntensity,
          weatherCode,
          description: getWeatherDescription(weatherCode),
          windSpeed,
          cloudCover,
        };
      });
    }

    if (response.current) {
      const weatherCode = response.current.weather_code ?? 0;
      weatherData.current = {
        temperature: response.current.temperature_2m ?? 0,
        temperatureApparent:
          response.current.apparent_temperature ??
          response.current.temperature_2m ??
          0,
        humidity: response.current.relative_humidity_2m ?? 0,
        weatherCode,
        description: getWeatherDescription(weatherCode),
        windSpeed: response.current.wind_speed_10m ?? 0,
        windDirection: response.current.wind_direction_10m ?? 0,
        cloudCover: response.current.cloud_cover ?? 0,
        uvIndex: response.daily?.uv_index_max?.[0],
      };
    }

    return weatherData;
  }

  /**
   * Transform Open-Meteo current response to simplified WeatherData.
   */
  private transformRealtimeResponse(
    response: OpenMeteoForecastResponse,
    location: string,
  ): WeatherData {
    const weatherData: WeatherData = {
      location,
    };

    if (!response.current) {
      return weatherData;
    }

    const weatherCode = response.current.weather_code ?? 0;
    weatherData.current = {
      temperature: response.current.temperature_2m ?? 0,
      temperatureApparent:
        response.current.apparent_temperature ??
        response.current.temperature_2m ??
        0,
      humidity: response.current.relative_humidity_2m ?? 0,
      weatherCode,
      description: getWeatherDescription(weatherCode),
      windSpeed: response.current.wind_speed_10m ?? 0,
      windDirection: response.current.wind_direction_10m ?? 0,
      cloudCover: response.current.cloud_cover ?? 0,
      uvIndex: response.daily?.uv_index_max?.[0],
    };

    return weatherData;
  }

  /**
   * Get cached data if still valid
   */
  private getCachedData(cacheKey: string): WeatherData | null {
    const entry = this.cache.get(cacheKey);
    if (!entry) {
      return null;
    }

    const now = Date.now();
    if (now - entry.timestamp > this.cacheTTL) {
      this.cache.delete(cacheKey);
      return null;
    }

    return entry.data;
  }

  /**
   * Set cached data
   */
  private setCachedData(cacheKey: string, data: WeatherData): void {
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Normalize start date to avoid free-tier past-date restrictions
   */
  private normalizeStartDate(date?: string | null): string | undefined {
    if (!date) return undefined;
    const parsed = new Date(date);
    if (isNaN(parsed.getTime())) return undefined;
    return parsed.toISOString();
  }

  /**
   * Normalize end date; ensure it's after start if provided
   */
  private normalizeEndDate(
    date?: string | null,
    start?: string | undefined,
  ): string | undefined {
    if (!date) return undefined;
    const parsed = new Date(date);
    if (isNaN(parsed.getTime())) return undefined;
    if (start) {
      const startDate = new Date(start);
      if (parsed.getTime() < startDate.getTime()) return undefined;
    }
    return parsed.toISOString();
  }

  private async resolveCoordinates(
    location: string,
  ): Promise<{ latitude: number; longitude: number }> {
    const parsedCoordinates = this.parseCoordinateLocation(location);
    if (parsedCoordinates) {
      return parsedCoordinates;
    }

    const geocodingResponse = await this.requestWithRetry<OpenMeteoGeocodingResponse>(
      this.geocodingBaseUrl,
      {
        name: location,
        count: 1,
      },
    );

    const firstResult = geocodingResponse.results?.[0];
    if (!firstResult) {
      throw new HttpException('Location not found', HttpStatus.NOT_FOUND);
    }

    return {
      latitude: firstResult.latitude,
      longitude: firstResult.longitude,
    };
  }

  private parseCoordinateLocation(
    location: string,
  ): { latitude: number; longitude: number } | null {
    const splitLocation = location.split(',');
    if (splitLocation.length !== 2) {
      return null;
    }

    const latitude = Number(splitLocation[0].trim());
    const longitude = Number(splitLocation[1].trim());
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return null;
    }

    return { latitude, longitude };
  }

  private buildForecastParams(
    latitude: number,
    longitude: number,
    startDate?: string,
    endDate?: string,
  ): Record<string, string | number> {
    const params: Record<string, string | number> = {
      latitude,
      longitude,
      timezone: 'auto',
      current:
        'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,cloud_cover',
      daily:
        'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,wind_speed_10m_max,cloud_cover_mean,uv_index_max',
    };

    if (startDate) {
      const startIso = this.toDateOnly(startDate);
      if (!startIso) {
        throw new HttpException('Invalid start date', HttpStatus.BAD_REQUEST);
      }
      params.start_date = startIso;
    }

    if (endDate) {
      const endIso = this.toDateOnly(endDate);
      if (!endIso) {
        throw new HttpException('Invalid end date', HttpStatus.BAD_REQUEST);
      }
      params.end_date = endIso;
    }

    const now = new Date();
    const defaultStart = new Date(now);
    const defaultEnd = new Date(now);
    defaultEnd.setDate(defaultEnd.getDate() + this.maxForecastDays - 1);

    const selectedStart = params.start_date ? new Date(String(params.start_date)) : defaultStart;
    const selectedEnd = params.end_date ? new Date(String(params.end_date)) : defaultEnd;
    const daySpan = Math.ceil(
      (selectedEnd.getTime() - selectedStart.getTime()) / (24 * 60 * 60 * 1000),
    );
    if (daySpan < 0) {
      throw new HttpException('End date must be after start date', HttpStatus.BAD_REQUEST);
    }
    if (daySpan >= this.maxForecastDays) {
      selectedEnd.setTime(
        selectedStart.getTime() + (this.maxForecastDays - 1) * 24 * 60 * 60 * 1000,
      );
      params.end_date = selectedEnd.toISOString().slice(0, 10);
    }

    return params;
  }

  private toDateOnly(value: string): string | null {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return null;
    }
    return parsed.toISOString().slice(0, 10);
  }

  private async requestWithRetry<T>(
    url: string,
    params: Record<string, string | number>,
  ): Promise<T> {
    let attempt = 0;
    let lastError: unknown = null;

    while (attempt <= this.maxRetries) {
      try {
        await this.waitForRateLimit();
        const response = await firstValueFrom(
          this.httpService.get<T>(url, {
            params,
            timeout: this.requestTimeoutMs,
          }),
        );
        return response.data;
      } catch (error) {
        lastError = error;
        const shouldRetry = attempt < this.maxRetries;
        if (!shouldRetry) {
          break;
        }
        await this.delay(250 * (attempt + 1));
      }
      attempt += 1;
    }

    this.logger.error('Weather provider request failed', {
      url,
      message: this.extractErrorMessage(lastError),
    });

    const errorStatus = this.extractErrorStatus(lastError);
    if (errorStatus === 400) {
      throw new HttpException('Invalid weather request', HttpStatus.BAD_REQUEST);
    }
    if (errorStatus === 404) {
      throw new HttpException('Location not found', HttpStatus.NOT_FOUND);
    }
    if (errorStatus === 429) {
      throw new HttpException(
        'Weather API rate limit exceeded',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    throw new HttpException(
      'Weather provider unavailable',
      HttpStatus.BAD_GATEWAY,
    );
  }

  private async waitForRateLimit(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.lastRequestAt;
    if (elapsed < this.minRequestIntervalMs) {
      await this.delay(this.minRequestIntervalMs - elapsed);
    }
    this.lastRequestAt = Date.now();
  }

  private async delay(ms: number): Promise<void> {
    await new Promise<void>((resolve) => {
      setTimeout(() => resolve(), ms);
    });
  }

  private extractErrorStatus(error: unknown): number | null {
    if (typeof error !== 'object' || error === null) {
      return null;
    }
    if (!('response' in error)) {
      return null;
    }
    const response = error.response;
    if (typeof response !== 'object' || response === null) {
      return null;
    }
    if (!('status' in response)) {
      return null;
    }
    const status = response.status;
    if (typeof status !== 'number') {
      return null;
    }
    return status;
  }

  private extractErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    return 'Unknown provider error';
  }
}

