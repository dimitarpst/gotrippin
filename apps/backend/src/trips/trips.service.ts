import { Injectable, NotFoundException, ForbiddenException, ServiceUnavailableException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { ImagesService } from '../images/images.service';
import type { CoverPhotoInput } from '@gotrippin/core';

@Injectable()
export class TripsService {
  constructor(
    private supabaseService: SupabaseService,
    private imagesService: ImagesService,
  ) { }

  async getTrips(userId: string) {
    try {
      const trips = await this.supabaseService.getTrips(userId);
      return trips;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : error && typeof error === "object" && "message" in (error as any)
            ? String((error as any).message)
            : "Unknown error";

      console.error('Error in getTrips:', error);
      // Log the error details for debugging
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      } else {
        try {
          console.error('Error object:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
        } catch {
          console.error('Error object (stringified):', String(error));
        }
      }
      // This is an upstream (Supabase / network) failure, not "Not Found".
      throw new ServiceUnavailableException(
        `Failed to fetch trips: ${message}`
      );
    }
  }

  async createTrip(userId: string, tripData: {
    title?: string;
    destination?: string;
    start_date?: string;
    end_date?: string;
    cover_photo?: CoverPhotoInput;
    color?: string;
    description?: string;
  }) {
    try {
      const { cover_photo, ...rest } = tripData;

      let cover_photo_id: string | undefined;
      if (cover_photo) {
        cover_photo_id = await this.imagesService.downloadAndStorePhoto(cover_photo);
      } else if (!rest.color) {
        // No photo and no color selected — assign a random travel photo as the default cover
        try {
          const randomCover = await this.imagesService.getRandomTravelCoverInput();
          cover_photo_id = await this.imagesService.downloadAndStorePhoto(randomCover);
        } catch (e) {
          // Non-fatal: if Unsplash is unavailable, trip is created with no cover
          console.warn('Failed to fetch random cover photo for new trip:', e);
        }
      }

      const newTrip = await this.supabaseService.createTrip({
        ...rest,
        ...(cover_photo_id ? { cover_photo_id } : {}),
        created_at: new Date().toISOString(),
      });

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
    cover_photo: CoverPhotoInput;
    color: string;
    description: string;
  }>) {
    try {
      const existingTrip = await this.supabaseService.getTrips(userId);
      const trip = existingTrip.find(t => t.id === tripId);

      if (!trip) {
        throw new ForbiddenException('Trip not found or access denied');
      }

      const { cover_photo, ...rest } = updateData;

      let cover_photo_id: string | undefined;
      if (cover_photo) {
        cover_photo_id = await this.imagesService.downloadAndStorePhoto(cover_photo);
      }

      const filteredData = Object.fromEntries(
        Object.entries({ ...rest, ...(cover_photo_id ? { cover_photo_id } : {}) })
          .filter(([_, value]) => value !== undefined),
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

  async getTripByShareCode(shareCode: string, userId: string) {
    try {
      const trip = await this.supabaseService.getTripByShareCode(shareCode, userId);

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

  /** Persist extracted dominant color for the trip's cover photo so next load has instant gradient. */
  async updateCoverDominantColor(tripId: string, userId: string, dominantColor: string) {
    const trip = await this.supabaseService.getTrip(tripId, userId);
    if (!trip) {
      throw new ForbiddenException('Trip not found or access denied');
    }
    const photoId = (trip as { cover_photo?: { id: string } | null }).cover_photo?.id;
    if (!photoId) {
      throw new BadRequestException('Trip has no cover photo');
    }
    await this.supabaseService.updatePhotoDominantColor(photoId, dominantColor);
    return { ok: true };
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
