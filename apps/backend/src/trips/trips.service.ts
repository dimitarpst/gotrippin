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
    description?: string;
  }) {
    try {
      const tripWithUserId = {
        ...tripData,
        user_id: userId,
        created_at: new Date().toISOString(),
      };

      const newTrip = await this.supabaseService.createTrip(tripWithUserId);
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
      const trips = await this.supabaseService.getTrips(userId);
      const trip = trips.find(t => t.id === tripId);

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
}
