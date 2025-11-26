import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateActivityDto, UpdateActivityDto } from './dto';

@Injectable()
export class ActivitiesService {
  constructor(private supabaseService: SupabaseService) {}

  /**
   * Check if user is a member of the trip
   */
  private async validateTripMembership(tripId: string, userId: string): Promise<void> {
    const isMember = await this.supabaseService.isTripMember(tripId, userId);
    if (!isMember) {
      throw new ForbiddenException('You must be a member of this trip to access activities');
    }
  }

  /**
   * Validate that location belongs to the trip (if provided)
   */
  private async validateLocationBelongsToTrip(locationId: string, tripId: string): Promise<void> {
    const { data, error } = await this.supabaseService.getClient()
      .from('trip_locations')
      .select('trip_id')
      .eq('id', locationId)
      .single();

    if (error || !data) {
      throw new BadRequestException('Location not found');
    }

    if (data.trip_id !== tripId) {
      throw new BadRequestException('Location does not belong to this trip');
    }
  }

  /**
   * Get all activities for a trip
   */
  async getActivities(tripId: string, userId: string, locationId?: string) {
    await this.validateTripMembership(tripId, userId);

    let query = this.supabaseService.getClient()
      .from('activities')
      .select('*, trip_locations(id, location_name, order_index)')
      .eq('trip_id', tripId)
      .order('start_time', { ascending: true, nullsFirst: false });

    // Filter by location if provided
    if (locationId) {
      query = query.eq('location_id', locationId);
    }

    const { data, error } = await query;

    if (error) {
      throw new NotFoundException('Failed to fetch activities');
    }

    return data || [];
  }

  /**
   * Get a single activity by ID
   */
  async getActivity(activityId: string, userId: string) {
    const { data, error } = await this.supabaseService.getClient()
      .from('activities')
      .select('*, trip_locations(id, location_name, order_index)')
      .eq('id', activityId)
      .single();

    if (error || !data) {
      throw new NotFoundException('Activity not found');
    }

    // Validate membership
    await this.validateTripMembership(data.trip_id, userId);

    return data;
  }

  /**
   * Create a new activity
   */
  async createActivity(tripId: string, userId: string, dto: CreateActivityDto) {
    await this.validateTripMembership(tripId, userId);

    // Validate location belongs to trip if provided
    if (dto.location_id) {
      await this.validateLocationBelongsToTrip(dto.location_id, tripId);
    }

    // Validate times
    if (dto.start_time && dto.end_time) {
      if (new Date(dto.end_time) < new Date(dto.start_time)) {
        throw new BadRequestException('End time must be after or equal to start time');
      }
    }

    const activityData = {
      trip_id: tripId,
      location_id: dto.location_id ?? null,
      type: dto.type ?? 'custom',
      title: dto.title,
      notes: dto.notes ?? null,
      start_time: dto.start_time ?? null,
      end_time: dto.end_time ?? null,
      all_day: dto.all_day ?? false,
      icon: dto.icon ?? null,
      color: dto.color ?? null,
      created_by: userId,
    };

    const { data, error } = await this.supabaseService.getClient()
      .from('activities')
      .insert(activityData)
      .select('*, trip_locations(id, location_name, order_index)')
      .single();

    if (error) {
      throw new BadRequestException(`Failed to create activity: ${error.message}`);
    }

    return data;
  }

  /**
   * Update an existing activity
   */
  async updateActivity(activityId: string, userId: string, dto: UpdateActivityDto) {
    // First get the activity to validate membership
    const activity = await this.getActivity(activityId, userId);
    const tripId = activity.trip_id;

    // Validate location belongs to trip if being changed
    if (dto.location_id !== undefined && dto.location_id !== null) {
      await this.validateLocationBelongsToTrip(dto.location_id, tripId);
    }

    // Validate times
    const startTime = dto.start_time !== undefined ? dto.start_time : activity.start_time;
    const endTime = dto.end_time !== undefined ? dto.end_time : activity.end_time;

    if (startTime && endTime) {
      if (new Date(endTime) < new Date(startTime)) {
        throw new BadRequestException('End time must be after or equal to start time');
      }
    }

    // Filter out undefined values
    const updateData = Object.fromEntries(
      Object.entries(dto).filter(([_, value]) => value !== undefined)
    );

    if (Object.keys(updateData).length === 0) {
      return activity; // No changes
    }

    const { data, error } = await this.supabaseService.getClient()
      .from('activities')
      .update(updateData)
      .eq('id', activityId)
      .select('*, trip_locations(id, location_name, order_index)')
      .single();

    if (error) {
      throw new BadRequestException(`Failed to update activity: ${error.message}`);
    }

    return data;
  }

  /**
   * Delete an activity
   */
  async deleteActivity(activityId: string, userId: string) {
    // First get the activity to validate membership
    await this.getActivity(activityId, userId);

    const { error } = await this.supabaseService.getClient()
      .from('activities')
      .delete()
      .eq('id', activityId);

    if (error) {
      throw new BadRequestException(`Failed to delete activity: ${error.message}`);
    }

    return { message: 'Activity deleted successfully' };
  }

  /**
   * Get activities grouped by location
   */
  async getActivitiesGroupedByLocation(tripId: string, userId: string) {
    await this.validateTripMembership(tripId, userId);

    // Get all locations with their activities
    const { data: locations, error: locError } = await this.supabaseService.getClient()
      .from('trip_locations')
      .select('*, activities(*)')
      .eq('trip_id', tripId)
      .order('order_index', { ascending: true });

    if (locError) {
      throw new NotFoundException('Failed to fetch locations with activities');
    }

    // Get activities without a location (unassigned)
    const { data: unassignedActivities, error: unassignedError } = await this.supabaseService.getClient()
      .from('activities')
      .select('*')
      .eq('trip_id', tripId)
      .is('location_id', null)
      .order('start_time', { ascending: true, nullsFirst: false });

    if (unassignedError) {
      throw new NotFoundException('Failed to fetch unassigned activities');
    }

    return {
      locations: locations || [],
      unassigned: unassignedActivities || [],
    };
  }
}

