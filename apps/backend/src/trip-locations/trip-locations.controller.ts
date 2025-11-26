import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TripLocationsService } from './trip-locations.service';
import { CreateTripLocationDto, UpdateTripLocationDto, ReorderLocationsDto } from './dto';

@ApiTags('Trip Locations')
@Controller('trips/:tripId/locations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TripLocationsController {
  constructor(private readonly tripLocationsService: TripLocationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all locations for a trip (route)' })
  @ApiParam({ name: 'tripId', description: 'Trip ID' })
  @ApiResponse({ status: 200, description: 'Returns all locations in order' })
  @ApiResponse({ status: 403, description: 'User is not a member of this trip' })
  @ApiResponse({ status: 404, description: 'Trip not found' })
  async getRoute(@Param('tripId') tripId: string, @Request() req: any) {
    const userId = req.user.id;
    return this.tripLocationsService.getRoute(tripId, userId);
  }

  @Post()
  @ApiOperation({ summary: 'Add a new location to the trip route' })
  @ApiParam({ name: 'tripId', description: 'Trip ID' })
  @ApiResponse({ status: 201, description: 'Location created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 403, description: 'User is not a member of this trip' })
  async addLocation(
    @Param('tripId') tripId: string,
    @Body() dto: CreateTripLocationDto,
    @Request() req: any,
  ) {
    const userId = req.user.id;
    return this.tripLocationsService.addLocation(tripId, userId, dto);
  }

  @Get(':locationId')
  @ApiOperation({ summary: 'Get a single location by ID' })
  @ApiParam({ name: 'tripId', description: 'Trip ID' })
  @ApiParam({ name: 'locationId', description: 'Location ID' })
  @ApiResponse({ status: 200, description: 'Returns the location' })
  @ApiResponse({ status: 403, description: 'User is not a member of this trip' })
  @ApiResponse({ status: 404, description: 'Location not found' })
  async getLocation(
    @Param('tripId') tripId: string,
    @Param('locationId') locationId: string,
    @Request() req: any,
  ) {
    const userId = req.user.id;
    return this.tripLocationsService.getLocation(locationId, userId);
  }

  @Put(':locationId')
  @ApiOperation({ summary: 'Update a location' })
  @ApiParam({ name: 'tripId', description: 'Trip ID' })
  @ApiParam({ name: 'locationId', description: 'Location ID' })
  @ApiResponse({ status: 200, description: 'Location updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 403, description: 'User is not a member of this trip' })
  @ApiResponse({ status: 404, description: 'Location not found' })
  async updateLocation(
    @Param('tripId') tripId: string,
    @Param('locationId') locationId: string,
    @Body() dto: UpdateTripLocationDto,
    @Request() req: any,
  ) {
    const userId = req.user.id;
    return this.tripLocationsService.updateLocation(locationId, userId, dto);
  }

  @Delete(':locationId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a location from the route' })
  @ApiParam({ name: 'tripId', description: 'Trip ID' })
  @ApiParam({ name: 'locationId', description: 'Location ID' })
  @ApiResponse({ status: 200, description: 'Location deleted successfully' })
  @ApiResponse({ status: 403, description: 'User is not a member of this trip' })
  @ApiResponse({ status: 404, description: 'Location not found' })
  async removeLocation(
    @Param('tripId') tripId: string,
    @Param('locationId') locationId: string,
    @Request() req: any,
  ) {
    const userId = req.user.id;
    return this.tripLocationsService.removeLocation(locationId, userId);
  }

  @Post('reorder')
  @ApiOperation({ summary: 'Reorder all locations in the route' })
  @ApiParam({ name: 'tripId', description: 'Trip ID' })
  @ApiResponse({ status: 200, description: 'Locations reordered successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data or missing locations' })
  @ApiResponse({ status: 403, description: 'User is not a member of this trip' })
  async reorderLocations(
    @Param('tripId') tripId: string,
    @Body() dto: ReorderLocationsDto,
    @Request() req: any,
  ) {
    const userId = req.user.id;
    return this.tripLocationsService.reorderLocations(tripId, userId, dto);
  }
}

