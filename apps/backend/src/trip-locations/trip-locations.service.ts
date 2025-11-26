import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateTripLocationDto, UpdateTripLocationDto, ReorderLocationsDto } from './dto';

@Injectable()
export class TripLocationsService {
  constructor(private supabaseService: SupabaseService) {}

  /**
   * Check if user is a member of the trip
   */
  private async validateTripMembership(tripId: string, userId: string): Promise<void> {
    const isMember = await this.supabaseService.isTripMember(tripId, userId);
    if (!isMember) {
      throw new ForbiddenException('You must be a member of this trip to access locations');
    }
  }

  /**
   * Get all locations for a trip (ordered by order_index)
   */
  async getRoute(tripId: string, userId: string) {
    await this.validateTripMembership(tripId, userId);

    const { data, error } = await this.supabaseService.getClient()
      .from('trip_locations')
      .select('*')
      .eq('trip_id', tripId)
      .order('order_index', { ascending: true });

    if (error) {
      throw new NotFoundException('Failed to fetch route locations');
    }

    return data || [];
  }

  /**
   * Get a single location by ID
   */
  async getLocation(locationId: string, userId: string) {
    const { data, error } = await this.supabaseService.getClient()
      .from('trip_locations')
      .select('*')
      .eq('id', locationId)
      .single();

    if (error || !data) {
      throw new NotFoundException('Location not found');
    }

    // Validate membership
    await this.validateTripMembership(data.trip_id, userId);

    return data;
  }

  /**
   * Add a new location to a trip's route
   */
  async addLocation(tripId: string, userId: string, dto: CreateTripLocationDto) {
    await this.validateTripMembership(tripId, userId);

    // If no order_index provided, get the max order_index and add 1
    let orderIndex = dto.order_index;
    if (!orderIndex) {
      const { data: existingLocations } = await this.supabaseService.getClient()
        .from('trip_locations')
        .select('order_index')
        .eq('trip_id', tripId)
        .order('order_index', { ascending: false })
        .limit(1);

      orderIndex = existingLocations && existingLocations.length > 0
        ? existingLocations[0].order_index + 1
        : 1;
    }

    // Validate dates if both provided
    if (dto.arrival_date && dto.departure_date) {
      if (new Date(dto.departure_date) < new Date(dto.arrival_date)) {
        throw new BadRequestException('Departure date must be after or equal to arrival date');
      }
    }

    const locationData = {
      trip_id: tripId,
      location_name: dto.location_name,
      latitude: dto.latitude ?? null,
      longitude: dto.longitude ?? null,
      order_index: orderIndex,
      arrival_date: dto.arrival_date ?? null,
      departure_date: dto.departure_date ?? null,
    };

    const { data, error } = await this.supabaseService.getClient()
      .from('trip_locations')
      .insert(locationData)
      .select()
      .single();

    if (error) {
      // Handle unique constraint violation on order_index
      if (error.code === '23505') {
        throw new BadRequestException('A location with this order index already exists. Use reorder to change positions.');
      }
      throw new BadRequestException(`Failed to add location: ${error.message}`);
    }

    return data;
  }

  /**
   * Update an existing location
   */
  async updateLocation(locationId: string, userId: string, dto: UpdateTripLocationDto) {
    // First get the location to validate membership
    const location = await this.getLocation(locationId, userId);

    // Validate dates if both provided
    const arrivalDate = dto.arrival_date !== undefined ? dto.arrival_date : location.arrival_date;
    const departureDate = dto.departure_date !== undefined ? dto.departure_date : location.departure_date;

    if (arrivalDate && departureDate) {
      if (new Date(departureDate) < new Date(arrivalDate)) {
        throw new BadRequestException('Departure date must be after or equal to arrival date');
      }
    }

    // Filter out undefined values
    const updateData = Object.fromEntries(
      Object.entries(dto).filter(([_, value]) => value !== undefined)
    );

    if (Object.keys(updateData).length === 0) {
      return location; // No changes
    }

    const { data, error } = await this.supabaseService.getClient()
      .from('trip_locations')
      .update(updateData)
      .eq('id', locationId)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new BadRequestException('A location with this order index already exists. Use reorder to change positions.');
      }
      throw new BadRequestException(`Failed to update location: ${error.message}`);
    }

    return data;
  }

  /**
   * Remove a location from the route and reorder remaining locations
   */
  async removeLocation(locationId: string, userId: string) {
    // First get the location to validate membership and get trip_id
    const location = await this.getLocation(locationId, userId);
    const tripId = location.trip_id;
    const removedOrderIndex = location.order_index;

    // Delete the location
    const { error: deleteError } = await this.supabaseService.getClient()
      .from('trip_locations')
      .delete()
      .eq('id', locationId);

    if (deleteError) {
      throw new BadRequestException(`Failed to delete location: ${deleteError.message}`);
    }

    // Reorder remaining locations to fill the gap
    const { data: remainingLocations, error: fetchError } = await this.supabaseService.getClient()
      .from('trip_locations')
      .select('id, order_index')
      .eq('trip_id', tripId)
      .gt('order_index', removedOrderIndex)
      .order('order_index', { ascending: true });

    if (fetchError) {
      console.error('Failed to fetch remaining locations for reorder:', fetchError);
      // Don't throw - deletion was successful, reorder is best-effort
      return { message: 'Location deleted successfully' };
    }

    // Update each location's order_index (decrement by 1)
    if (remainingLocations && remainingLocations.length > 0) {
      for (const loc of remainingLocations) {
        await this.supabaseService.getClient()
          .from('trip_locations')
          .update({ order_index: loc.order_index - 1 })
          .eq('id', loc.id);
      }
    }

    return { message: 'Location deleted successfully' };
  }

  /**
   * Reorder locations (bulk update order_index)
   */
  async reorderLocations(tripId: string, userId: string, dto: ReorderLocationsDto) {
    await this.validateTripMembership(tripId, userId);

    const { location_ids } = dto;

    // Verify all location_ids belong to this trip
    const { data: existingLocations, error: fetchError } = await this.supabaseService.getClient()
      .from('trip_locations')
      .select('id')
      .eq('trip_id', tripId);

    if (fetchError) {
      throw new BadRequestException('Failed to verify locations');
    }

    const existingIds = new Set(existingLocations?.map(l => l.id) || []);
    const invalidIds = location_ids.filter(id => !existingIds.has(id));

    if (invalidIds.length > 0) {
      throw new BadRequestException(`Invalid location IDs: ${invalidIds.join(', ')}`);
    }

    // Check if we're missing any locations
    const providedIds = new Set(location_ids);
    const missingIds = [...existingIds].filter(id => !providedIds.has(id));

    if (missingIds.length > 0) {
      throw new BadRequestException(
        `All locations must be included in reorder. Missing: ${missingIds.join(', ')}`
      );
    }

    // Update order_index for each location
    // Use a transaction-like approach: update to negative values first, then positive
    // This avoids unique constraint violations during reorder
    const updates = location_ids.map(async (id, index) => {
      const { error } = await this.supabaseService.getClient()
        .from('trip_locations')
        .update({ order_index: -(index + 1) }) // Temporary negative value
        .eq('id', id);

      if (error) {
        throw new BadRequestException(`Failed to reorder location ${id}: ${error.message}`);
      }
    });

    await Promise.all(updates);

    // Now update to actual positive values
    const finalUpdates = location_ids.map(async (id, index) => {
      const { error } = await this.supabaseService.getClient()
        .from('trip_locations')
        .update({ order_index: index + 1 })
        .eq('id', id);

      if (error) {
        throw new BadRequestException(`Failed to finalize reorder for location ${id}: ${error.message}`);
      }
    });

    await Promise.all(finalUpdates);

    // Return the reordered locations
    return this.getRoute(tripId, userId);
  }
}

