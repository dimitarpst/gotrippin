import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import type {
  TomorrowTimelineResponse,
  WeatherData,
  TripWeatherResponse,
  TripLocationWeather,
} from '@gotrippin/core';
import { getWeatherDescription } from '@gotrippin/core';
import { TripLocationsService } from '../trip-locations/trip-locations.service';

interface CacheEntry {
  data: WeatherData;
  timestamp: number;
}

@Injectable()
export class WeatherService {
  private readonly logger = new Logger(WeatherService.name);
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.tomorrow.io/v4';
  private readonly cache = new Map<string, CacheEntry>();
  private readonly cacheTTL = 10 * 60 * 1000; // 10 minutes
  private readonly maxForecastDays = 14;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly tripLocationsService: TripLocationsService,
  ) {
    this.apiKey = this.configService.get<string>('TOMORROW_IO_API_KEY');
    if (!this.apiKey) {
      this.logger.warn(
        'TOMORROW_IO_API_KEY not found in environment variables',
      );
    } else {
      this.logger.log(
        `Tomorrow.io API key loaded (length: ${this.apiKey.length})`,
      );
    }
  }

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

        const normalizedStart = this.normalizeStartDate(loc.arrival_date);
        const normalizedEnd = this.normalizeEndDate(loc.departure_date, normalizedStart);

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

    if (!this.apiKey) {
      throw new HttpException(
        'Weather API key not configured',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    try {
      // Build request body for Timeline API
      const requestBody: any = {
        location,
        fields: [
          'temperature',
          'temperatureApparent',
          'humidity',
          'precipitationProbability',
          'precipitationIntensity',
          'weatherCode',
          'windSpeed',
          'windDirection',
          'cloudCover',
          'visibility',
          'uvIndex',
        ],
        timesteps: ['1h', '1d'],
        units: 'metric',
      };

      // Validate dates - free tier doesn't allow historical data more than 24 hours in the past
      if (startDate) {
        const start = new Date(startDate);
        const now = new Date();
        const hoursDiff = (now.getTime() - start.getTime()) / (1000 * 60 * 60);
        
        if (hoursDiff > 24) {
          throw new HttpException(
            'Free tier plan restriction: startTime cannot be more than 24 hours in the past. Please use current or future dates.',
            HttpStatus.BAD_REQUEST,
          );
        }
        
        requestBody.startTime = startDate;
      }
      if (endDate) {
        requestBody.endTime = endDate;
      }

      // Adjust timesteps based on window length to avoid Tomorrow.io rule violations
      if (requestBody.startTime && requestBody.endTime) {
        const start = new Date(requestBody.startTime).getTime();
        const end = new Date(requestBody.endTime).getTime();
        const windowMs = end - start;

        // If window invalid or <=0, drop endTime and keep default timesteps
        if (windowMs <= 0) {
          delete requestBody.endTime;
        } else if (windowMs < 24 * 60 * 60 * 1000) {
          // For windows < 24h use only hourly
          requestBody.timesteps = ['1h'];
        } else {
          // For >=24h use hourly + daily
          requestBody.timesteps = ['1h', '1d'];
        }
      } else {
        // When no range provided, default to hourly + daily
        requestBody.timesteps = ['1h', '1d'];
      }

      const url = `${this.baseUrl}/timelines`;
      const response = await firstValueFrom(
        this.httpService.post<TomorrowTimelineResponse>(
          url,
          requestBody,
          {
            params: {
              apikey: this.apiKey,
            },
          },
        ),
      );

      const weatherData = this.transformTimelineResponse(
        response.data,
        location,
      );
      
      // Cache the result
      this.setCachedData(cacheKey, weatherData);
      
      return weatherData;
    } catch (error: any) {
      // Preserve intentionally thrown HttpExceptions (e.g., date validation)
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error('Error fetching weather timeline', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
      });
      
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;
        const message = data?.message || data?.type || error.message;
        const code = data?.code;
        
        if (status === 401) {
          this.logger.error(
            `Authentication failed. API key length: ${this.apiKey?.length || 0}`,
          );
          throw new HttpException(
            `Invalid weather API key: ${message}`,
            HttpStatus.UNAUTHORIZED,
          );
        } else if (status === 403) {
          // 403 can be either authentication or plan restrictions
          if (code === 403003 || message?.includes('plan is restricted') || message?.includes('cannot be more than')) {
            // Plan restriction error (e.g., free tier limitations)
            throw new HttpException(
              `Plan restriction: ${message}`,
              HttpStatus.FORBIDDEN,
            );
          } else {
            // Authentication error (wrong key)
            throw new HttpException(
              `Invalid weather API key: ${message}`,
              HttpStatus.UNAUTHORIZED,
            );
          }
        } else if (status === 429) {
          throw new HttpException(
            'Weather API rate limit exceeded',
            HttpStatus.TOO_MANY_REQUESTS,
          );
        } else if (status === 400) {
          throw new HttpException(
            `Invalid request: ${message}`,
            HttpStatus.BAD_REQUEST,
          );
        } else if (status === 404) {
          throw new HttpException(
            'Location not found',
            HttpStatus.NOT_FOUND,
          );
        }
      }
      
      throw new HttpException(
        `Failed to fetch weather data: ${error.message}`,
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

    if (!this.apiKey) {
      throw new HttpException(
        'Weather API key not configured',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    try {
      // Build request body for Timeline API with current timestep
      const requestBody = {
        location,
        fields: [
          'temperature',
          'temperatureApparent',
          'humidity',
          'precipitationProbability',
          'precipitationIntensity',
          'weatherCode',
          'windSpeed',
          'windDirection',
          'cloudCover',
          'visibility',
          'uvIndex',
        ],
        timesteps: ['current'],
        units: 'metric',
      };

      const url = `${this.baseUrl}/timelines`;
      this.logger.debug(`Calling Tomorrow.io API (realtime): ${url}`);
      
      const response = await firstValueFrom(
        this.httpService.post<TomorrowTimelineResponse>(
          url,
          requestBody,
          {
            headers: {
              apikey: this.apiKey,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      const weatherData = this.transformRealtimeResponse(
        response.data,
        location,
      );
      
      // Cache the result
      this.setCachedData(cacheKey, weatherData);
      
      return weatherData;
    } catch (error: any) {
      this.logger.error('Error fetching realtime weather', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
      });
      
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;
        const message = data?.message || data?.type || error.message;
        const code = data?.code;
        
        if (status === 401) {
          this.logger.error(
            `Authentication failed. API key length: ${this.apiKey?.length || 0}`,
          );
          throw new HttpException(
            `Invalid weather API key: ${message}`,
            HttpStatus.UNAUTHORIZED,
          );
        } else if (status === 403) {
          // 403 can be either authentication or plan restrictions
          if (code === 403003 || message?.includes('plan is restricted') || message?.includes('cannot be more than')) {
            // Plan restriction error (e.g., free tier limitations)
            throw new HttpException(
              `Plan restriction: ${message}`,
              HttpStatus.FORBIDDEN,
            );
          } else {
            // Authentication error (wrong key)
            throw new HttpException(
              `Invalid weather API key: ${message}`,
              HttpStatus.UNAUTHORIZED,
            );
          }
        } else if (status === 429) {
          throw new HttpException(
            'Weather API rate limit exceeded',
            HttpStatus.TOO_MANY_REQUESTS,
          );
        } else if (status === 400) {
          throw new HttpException(
            `Invalid request: ${message}`,
            HttpStatus.BAD_REQUEST,
          );
        } else if (status === 404) {
          throw new HttpException(
            'Location not found',
            HttpStatus.NOT_FOUND,
          );
        }
      }
      
      throw new HttpException(
        `Failed to fetch weather data: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Transform Tomorrow.io timeline response to simplified WeatherData
   */
  private transformTimelineResponse(
    response: TomorrowTimelineResponse,
    location: string,
  ): WeatherData {
    const weatherData: WeatherData = {
      location,
      forecast: [],
    };

    if (!response.data?.timelines || response.data.timelines.length === 0) {
      return weatherData;
    }

    // Find daily timeline (1d timestep)
    const dailyTimeline = response.data.timelines.find(
      (t) => t.timestep === '1d',
    );

    if (dailyTimeline && dailyTimeline.intervals) {
      weatherData.forecast = dailyTimeline.intervals.map((interval) => {
        const values = interval.values;
        return {
          date: interval.startTime,
          temperatureMin: values.temperature,
          temperatureMax: values.temperature,
          temperature: values.temperature,
          humidity: values.humidity || 0,
          precipitationProbability: values.precipitationProbability || 0,
          precipitationIntensity: values.precipitationIntensity || 0,
          weatherCode: values.weatherCode || 1000,
          description: getWeatherDescription(values.weatherCode || 1000),
          windSpeed: values.windSpeed || 0,
          cloudCover: values.cloudCover || 0,
        };
      });
    }

    // Find hourly timeline for current weather (1h timestep, first interval)
    const hourlyTimeline = response.data.timelines.find(
      (t) => t.timestep === '1h',
    );

    if (hourlyTimeline && hourlyTimeline.intervals.length > 0) {
      const currentInterval = hourlyTimeline.intervals[0];
      const values = currentInterval.values;
      
      weatherData.current = {
        temperature: values.temperature || 0,
        temperatureApparent: values.temperatureApparent || values.temperature || 0,
        humidity: values.humidity || 0,
        weatherCode: values.weatherCode || 1000,
        description: getWeatherDescription(values.weatherCode || 1000),
        windSpeed: values.windSpeed || 0,
        windDirection: values.windDirection || 0,
        cloudCover: values.cloudCover || 0,
        uvIndex: values.uvIndex,
      };
    }

    return weatherData;
  }

  /**
   * Transform Tomorrow.io realtime response to simplified WeatherData
   */
  private transformRealtimeResponse(
    response: TomorrowTimelineResponse,
    location: string,
  ): WeatherData {
    const weatherData: WeatherData = {
      location,
    };

    if (!response.data?.timelines || response.data.timelines.length === 0) {
      return weatherData;
    }

    // Find current timeline
    const currentTimeline = response.data.timelines.find(
      (t) => t.timestep === 'current',
    );

    if (currentTimeline && currentTimeline.intervals.length > 0) {
      const interval = currentTimeline.intervals[0];
      const values = interval.values;
      
      weatherData.current = {
        temperature: values.temperature || 0,
        temperatureApparent: values.temperatureApparent || values.temperature || 0,
        humidity: values.humidity || 0,
        weatherCode: values.weatherCode || 1000,
        description: getWeatherDescription(values.weatherCode || 1000),
        windSpeed: values.windSpeed || 0,
        windDirection: values.windDirection || 0,
        cloudCover: values.cloudCover || 0,
        uvIndex: values.uvIndex,
      };
    }

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
    const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
    if (parsed.getTime() < twentyFourHoursAgo) return undefined;
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
}

