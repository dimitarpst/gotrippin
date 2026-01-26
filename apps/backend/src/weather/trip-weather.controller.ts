import { Controller, Get, Header, Param, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { WeatherService } from './weather.service';
import { GetTripWeatherDto } from './dto/get-trip-weather.dto';
import type { TripWeatherResponse } from '@gotrippin/core';

@ApiTags('weather')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('trips/:tripId/weather')
export class TripWeatherController {
  constructor(private readonly weatherService: WeatherService) {}

  @Get()
  @Header('Cache-Control', 'private, max-age=600, stale-while-revalidate=60')
  @Header('Vary', 'Authorization')
  @ApiOperation({
    summary: 'Get weather forecasts for all stops in a trip',
    description: 'Returns per-stop weather using the trip route. Requires trip membership.',
  })
  @ApiParam({ name: 'tripId', description: 'Trip ID' })
  @ApiQuery({
    name: 'days',
    required: false,
    description: 'Limit number of forecast days (1-14)',
    example: 5,
  })
  async getTripWeather(
    @Param('tripId') tripId: string,
    @Query() query: GetTripWeatherDto,
    @Request() req: any,
  ): Promise<TripWeatherResponse> {
    const userId = req.user.id;
    const days = query.days;
    return this.weatherService.getTripWeather(tripId, userId, { days });
  }
}

