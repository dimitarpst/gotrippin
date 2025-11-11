import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class TripsService {
  constructor(private supabaseService: SupabaseService) {}

  async getTrips(userId: string) {
    try {
      const trips = await this.supabaseService.getTrips(userId);
      return trips;
    } catch (error) {
      throw new NotFoundException('Failed to fetch trips');
    }
  }

  async createTrip(userId: string, tripData: {
    title?: string;
    destination?: string;
    start_date?: string;
    end_date?: string;
    image_url?: string;
    color?: string;
    description?: string;
  }) {
    try {
      // Create the trip (without user_id)
      const tripToCreate = {
        ...tripData,
        created_at: new Date().toISOString(),
      };

      const newTrip = await this.supabaseService.createTrip(tripToCreate);
      
      // Add the creator as the first member
      await this.supabaseService.addTripMember(newTrip.id, userId);
      
      return newTrip;
    } catch (error) {
      throw new NotFoundException('Failed to create trip');
    }
  }

  async updateTrip(tripId: string, userId: string, updateData: Partial<{
    title: string;
    destination: string;
    start_date: string;
    end_date: string;
    image_url: string;
    color: string;
    description: string;
  }>) {
    try {
      // First check if the trip belongs to the user
      const existingTrip = await this.supabaseService.getTrips(userId);
      const trip = existingTrip.find(t => t.id === tripId);

      if (!trip) {
        throw new ForbiddenException('Trip not found or access denied');
      }

      // Filter out undefined values
      const filteredData = Object.fromEntries(
        Object.entries(updateData).filter(([_, value]) => value !== undefined)
      );

      const updatedTrip = await this.supabaseService.updateTrip(tripId, filteredData);
      return updatedTrip;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      throw new NotFoundException('Failed to update trip');
    }
  }

  async deleteTrip(tripId: string, userId: string) {
    try {
      // First check if the trip belongs to the user
      const existingTrip = await this.supabaseService.getTrips(userId);
      const trip = existingTrip.find(t => t.id === tripId);

      if (!trip) {
        throw new ForbiddenException('Trip not found or access denied');
      }

      await this.supabaseService.deleteTrip(tripId);
      return { message: 'Trip deleted successfully' };
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      throw new NotFoundException('Failed to delete trip');
    }
  }

  async getTripById(tripId: string, userId: string) {
    try {
      const trip = await this.supabaseService.getTrip(tripId, userId);

      if (!trip) {
        throw new ForbiddenException('Trip not found or access denied');
      }

      return trip;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      throw new NotFoundException('Trip not found');
    }
  }

  async addMember(tripId: string, currentUserId: string, userIdToAdd: string) {
    try {
      // Check if current user is a member of the trip
      const isMember = await this.supabaseService.isTripMember(tripId, currentUserId);
      
      if (!isMember) {
        throw new ForbiddenException('You must be a member of this trip to add others');
      }

      // Add the new member
      await this.supabaseService.addTripMember(tripId, userIdToAdd);
      return { message: 'Member added successfully' };
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      throw new NotFoundException('Failed to add member');
    }
  }

  async removeMember(tripId: string, currentUserId: string, userIdToRemove: string) {
    try {
      // Users can remove themselves, or check if they're a member to remove others
      const isMember = await this.supabaseService.isTripMember(tripId, currentUserId);
      
      if (!isMember && currentUserId !== userIdToRemove) {
        throw new ForbiddenException('You must be a member of this trip');
      }

      await this.supabaseService.removeTripMember(tripId, userIdToRemove);
      return { message: 'Member removed successfully' };
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      throw new NotFoundException('Failed to remove member');
    }
  }

  async getTripMembers(tripId: string, userId: string) {
    try {
      // Check if user is a member of the trip
      const isMember = await this.supabaseService.isTripMember(tripId, userId);
      
      if (!isMember) {
        throw new ForbiddenException('You must be a member of this trip to view members');
      }

      const members = await this.supabaseService.getTripMembers(tripId);
      return members;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      throw new NotFoundException('Failed to fetch trip members');
    }
  }
}
