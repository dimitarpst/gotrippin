import {
  Controller,
  Get,
  Query,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { WeatherService } from './weather.service';
import { GetWeatherTimelineDto } from './dto/get-weather-timeline.dto';
import { GetRealtimeWeatherDto } from './dto/get-realtime-weather.dto';
import type { WeatherData } from '@gotrippin/core';

@ApiTags('weather')
@Controller('weather')
export class WeatherController {
  constructor(private readonly weatherService: WeatherService) {}

  @Get('timeline')
  @ApiOperation({
    summary: 'Get weather forecast timeline',
    description:
      'Get weather forecast for a location and optional date range. Returns daily forecasts up to 14 days in the future.',
  })
  @ApiQuery({
    name: 'location',
    required: true,
    type: String,
    description: 'Location (city name or coordinates "lat,lon")',
    example: 'Tokyo',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Start date for forecast (ISO 8601 format)',
    example: '2026-02-11T00:00:00Z',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'End date for forecast (ISO 8601 format)',
    example: '2026-02-17T23:59:59Z',
  })
  @ApiResponse({
    status: 200,
    description: 'Weather forecast retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        location: { type: 'string', example: 'Tokyo' },
        current: {
          type: 'object',
          properties: {
            temperature: { type: 'number', example: 15 },
            temperatureApparent: { type: 'number', example: 14 },
            humidity: { type: 'number', example: 65 },
            weatherCode: { type: 'number', example: 1000 },
            description: { type: 'string', example: 'Clear, Sunny' },
            windSpeed: { type: 'number', example: 10 },
            windDirection: { type: 'number', example: 180 },
            cloudCover: { type: 'number', example: 20 },
            uvIndex: { type: 'number', example: 5 },
          },
        },
        forecast: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              date: { type: 'string', example: '2026-02-11T00:00:00Z' },
              temperature: { type: 'number', example: 15 },
              temperatureMin: { type: 'number', example: 12 },
              temperatureMax: { type: 'number', example: 18 },
              humidity: { type: 'number', example: 65 },
              precipitationProbability: { type: 'number', example: 30 },
              precipitationIntensity: { type: 'number', example: 0 },
              weatherCode: { type: 'number', example: 1000 },
              description: { type: 'string', example: 'Clear, Sunny' },
              windSpeed: { type: 'number', example: 10 },
              cloudCover: { type: 'number', example: 20 },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request parameters',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid API key',
  })
  @ApiResponse({
    status: 404,
    description: 'Location not found',
  })
  @ApiResponse({
    status: 429,
    description: 'Rate limit exceeded',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async getWeatherTimeline(
    @Query() query: GetWeatherTimelineDto,
  ): Promise<WeatherData> {
    try {
      return await this.weatherService.getWeatherTimeline(
        query.location,
        query.startDate,
        query.endDate,
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to fetch weather timeline',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('realtime')
  @ApiOperation({
    summary: 'Get current weather',
    description: 'Get current weather conditions for a location',
  })
  @ApiQuery({
    name: 'location',
    required: true,
    type: String,
    description: 'Location (city name or coordinates "lat,lon")',
    example: 'Tokyo',
  })
  @ApiResponse({
    status: 200,
    description: 'Current weather retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        location: { type: 'string', example: 'Tokyo' },
        current: {
          type: 'object',
          properties: {
            temperature: { type: 'number', example: 15 },
            temperatureApparent: { type: 'number', example: 14 },
            humidity: { type: 'number', example: 65 },
            weatherCode: { type: 'number', example: 1000 },
            description: { type: 'string', example: 'Clear, Sunny' },
            windSpeed: { type: 'number', example: 10 },
            windDirection: { type: 'number', example: 180 },
            cloudCover: { type: 'number', example: 20 },
            uvIndex: { type: 'number', example: 5 },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request parameters',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid API key',
  })
  @ApiResponse({
    status: 404,
    description: 'Location not found',
  })
  @ApiResponse({
    status: 429,
    description: 'Rate limit exceeded',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async getRealtimeWeather(
    @Query() query: GetRealtimeWeatherDto,
  ): Promise<WeatherData> {
    try {
      return await this.weatherService.getRealtimeWeather(query.location);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to fetch realtime weather',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

