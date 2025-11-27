import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ActivitiesService } from './activities.service';
import { CreateActivityDto, UpdateActivityDto } from './dto';

@ApiTags('Activities')
@Controller('trips/:tripId/activities')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all activities for a trip' })
  @ApiParam({ name: 'tripId', description: 'Trip ID' })
  @ApiQuery({ name: 'location_id', required: false, description: 'Filter by location ID' })
  @ApiResponse({ status: 200, description: 'Returns all activities' })
  @ApiResponse({ status: 403, description: 'User is not a member of this trip' })
  async getActivities(
    @Param('tripId') tripId: string,
    @Query('location_id') locationId: string,
    @Request() req: any,
  ) {
    const userId = req.user.id;
    return this.activitiesService.getActivities(tripId, userId, locationId);
  }

  @Get('grouped')
  @ApiOperation({ summary: 'Get activities grouped by location' })
  @ApiParam({ name: 'tripId', description: 'Trip ID' })
  @ApiResponse({ status: 200, description: 'Returns activities grouped by location' })
  @ApiResponse({ status: 403, description: 'User is not a member of this trip' })
  async getActivitiesGrouped(
    @Param('tripId') tripId: string,
    @Request() req: any,
  ) {
    const userId = req.user.id;
    return this.activitiesService.getActivitiesGroupedByLocation(tripId, userId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new activity' })
  @ApiParam({ name: 'tripId', description: 'Trip ID' })
  @ApiResponse({ status: 201, description: 'Activity created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 403, description: 'User is not a member of this trip' })
  async createActivity(
    @Param('tripId') tripId: string,
    @Body() dto: CreateActivityDto,
    @Request() req: any,
  ) {
    const userId = req.user.id;
    return this.activitiesService.createActivity(tripId, userId, dto);
  }

  @Get(':activityId')
  @ApiOperation({ summary: 'Get a single activity by ID' })
  @ApiParam({ name: 'tripId', description: 'Trip ID' })
  @ApiParam({ name: 'activityId', description: 'Activity ID' })
  @ApiResponse({ status: 200, description: 'Returns the activity' })
  @ApiResponse({ status: 403, description: 'User is not a member of this trip' })
  @ApiResponse({ status: 404, description: 'Activity not found' })
  async getActivity(
    @Param('tripId') tripId: string,
    @Param('activityId') activityId: string,
    @Request() req: any,
  ) {
    const userId = req.user.id;
    return this.activitiesService.getActivity(activityId, userId);
  }

  @Put(':activityId')
  @ApiOperation({ summary: 'Update an activity' })
  @ApiParam({ name: 'tripId', description: 'Trip ID' })
  @ApiParam({ name: 'activityId', description: 'Activity ID' })
  @ApiResponse({ status: 200, description: 'Activity updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 403, description: 'User is not a member of this trip' })
  @ApiResponse({ status: 404, description: 'Activity not found' })
  async updateActivity(
    @Param('tripId') tripId: string,
    @Param('activityId') activityId: string,
    @Body() dto: UpdateActivityDto,
    @Request() req: any,
  ) {
    const userId = req.user.id;
    return this.activitiesService.updateActivity(activityId, userId, dto);
  }

  @Delete(':activityId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete an activity' })
  @ApiParam({ name: 'tripId', description: 'Trip ID' })
  @ApiParam({ name: 'activityId', description: 'Activity ID' })
  @ApiResponse({ status: 200, description: 'Activity deleted successfully' })
  @ApiResponse({ status: 403, description: 'User is not a member of this trip' })
  @ApiResponse({ status: 404, description: 'Activity not found' })
  async deleteActivity(
    @Param('tripId') tripId: string,
    @Param('activityId') activityId: string,
    @Request() req: any,
  ) {
    const userId = req.user.id;
    return this.activitiesService.deleteActivity(activityId, userId);
  }
}

