import { Injectable, Logger, NotFoundException, ForbiddenException, ServiceUnavailableException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../supabase/supabase.service';
import { ImagesService } from '../images/images.service';
import { TripLocationsService } from '../trip-locations/trip-locations.service';
import { ActivitiesService } from '../activities/activities.service';
import { WeatherService } from '../weather/weather.service';
import { MailService } from '../mail/mail.service';
import {
  buildTripInviteEmailHtml,
  buildTripInviteEmailSubject,
  buildTripInviteEmailText,
} from '../mail/trip-invite-email';
import type {
  AddTripGalleryImageBody,
  CoverPhotoInput,
  Trip,
  TripGalleryImage,
  TripWeatherResponse,
} from '@gotrippin/core';

const MAX_TRIP_GALLERY_IMAGES = 100;
const GALLERY_KEY_PREFIX = 'trip-images/gallery/';

function assertGalleryStorageKeyForTrip(tripId: string, storageKey: string): void {
  const expected = `${GALLERY_KEY_PREFIX}${tripId}/`;
  if (!storageKey.startsWith(expected)) {
    throw new BadRequestException('Invalid gallery storage key for this trip');
  }
  if (storageKey.includes('..')) {
    throw new BadRequestException('Invalid gallery storage key');
  }
}

function readTripCoverForSync(
  trip: { cover_photo?: { id?: string; storage_key?: string } | null },
): { id: string; storage_key: string } | null {
  const c = trip.cover_photo;
  if (c?.id === undefined || c.id === '' || !c.storage_key) {
    return null;
  }
  return { id: c.id, storage_key: c.storage_key };
}

/** Former trip cover for promoting into trip_gallery_images when the user picks a new background. */
function readFormerCoverForGalleryPromotion(
  trip: { cover_photo?: { id?: string; storage_key?: string; blur_hash?: string | null } | null },
): { id: string; storage_key: string; blur_hash: string | null } | null {
  const c = trip.cover_photo;
  if (c?.id === undefined || c.id === '' || !c.storage_key) {
    return null;
  }
  const blur =
    typeof c.blur_hash === 'string' && c.blur_hash.length > 0 ? c.blur_hash : null;
  return { id: c.id, storage_key: c.storage_key, blur_hash: blur };
}

export interface TripDetailDto {
  trip: Awaited<ReturnType<TripsService['getTripByShareCode']>>;
  route_locations: unknown[] | null;
  route_locations_error?: string;
  grouped_activities: { locations: unknown[]; unassigned: unknown[] } | null;
  activities_error?: string;
  weather: TripWeatherResponse | null;
  weather_error?: string;
}

@Injectable()
export class TripsService {
  private readonly logger = new Logger(TripsService.name);

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly imagesService: ImagesService,
    private readonly tripLocationsService: TripLocationsService,
    private readonly activitiesService: ActivitiesService,
    private readonly weatherService: WeatherService,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * If the outgoing cover is not already in `trip_gallery_images`, add it (copying to gallery R2 prefix when needed)
   * so changing the hero does not lose that image from the trip grid.
   */
  private async promoteFormerCoverIntoGalleryIfNeeded(
    tripId: string,
    userId: string,
    former: { id: string; storage_key: string; blur_hash: string | null },
    newCoverPhotoId: string,
  ): Promise<void> {
    if (former.id === newCoverPhotoId) {
      return;
    }
    const count = await this.supabaseService.countTripGalleryImages(tripId);
    if (count >= MAX_TRIP_GALLERY_IMAGES) {
      this.logger.warn(
        `Trip ${tripId}: gallery at limit (${MAX_TRIP_GALLERY_IMAGES}); skipping former cover promotion`,
      );
      return;
    }
    const listed = await this.supabaseService.listTripGalleryImages(tripId);
    if (listed.some((g) => g.storage_key === former.storage_key)) {
      return;
    }
    const galleryPrefix = `${GALLERY_KEY_PREFIX}${tripId}/`;
    const storageKeyForRow = former.storage_key.startsWith(galleryPrefix)
      ? former.storage_key
      : await this.imagesService.copyStorageKeyIntoTripGallery(tripId, former.storage_key);

    await this.supabaseService.insertTripGalleryImage({
      trip_id: tripId,
      storage_key: storageKeyForRow,
      blur_hash: former.blur_hash,
      width: null,
      height: null,
      sort_order: count,
      created_by: userId,
    });
  }

  async getTrips(userId: string): Promise<Trip[]> {
    try {
      const trips = await this.supabaseService.getTrips(userId);
      const ids = trips
        .map((t: { id?: unknown }) => t.id)
        .filter((id): id is string => typeof id === 'string');
      let facepile: Record<string, { user_id: string; avatar_url: string | null; label: string }[]> = {};
      try {
        facepile = await this.supabaseService.getTripMemberFacepilePreviews(ids);
      } catch (previewErr) {
        this.logger.warn(
          `getTripMemberFacepilePreviews failed: ${previewErr instanceof Error ? previewErr.message : String(previewErr)}`,
        );
      }
      return trips.map((t: { id?: string }) => {
        const id = typeof t.id === 'string' ? t.id : '';
        const pile = id ? facepile[id] : undefined;
        return {
          ...t,
          member_facepile: pile !== undefined && pile.length > 0 ? pile : [],
        };
      }) as Trip[];
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
    cover_upload_storage_key?: string;
    color?: string;
    description?: string;
    notes?: string | null;
  }) {
    try {
      const { cover_photo, cover_upload_storage_key, ...rest } = tripData;

      let cover_photo_id: string | undefined;
      if (cover_upload_storage_key) {
        cover_photo_id = await this.imagesService.registerUploadedTripCoverPhoto(
          userId,
          cover_upload_storage_key,
        );
      } else if (cover_photo) {
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
    cover_upload_storage_key: string;
    color: string;
    description: string;
    notes: string | null;
    budget_amount_minor: number | null;
    budget_currency: string | null;
  }>) {
    try {
      const existingTrip = await this.supabaseService.getTrips(userId);
      const trip = existingTrip.find(t => t.id === tripId);

      if (!trip) {
        throw new ForbiddenException('Trip not found or access denied');
      }

      const { cover_photo, cover_upload_storage_key, ...rest } = updateData;

      let cover_photo_id: string | undefined;
      if (cover_upload_storage_key) {
        cover_photo_id = await this.imagesService.registerUploadedTripCoverPhoto(
          userId,
          cover_upload_storage_key,
        );
      } else if (cover_photo) {
        cover_photo_id = await this.imagesService.downloadAndStorePhoto(cover_photo);
      }

      const filteredData = Object.fromEntries(
        Object.entries({ ...rest, ...(cover_photo_id ? { cover_photo_id } : {}) })
          .filter(([_, value]) => value !== undefined),
      );

      if (cover_photo_id) {
        const former = readFormerCoverForGalleryPromotion(trip);
        if (former) {
          await this.promoteFormerCoverIntoGalleryIfNeeded(
            tripId,
            userId,
            former,
            cover_photo_id,
          );
        }
      }

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

  /**
   * Full trip detail for detail screen: trip + locations + timeline + weather.
   * Used by web server component and mobile; one request instead of four.
   */
  /**
   * Same payload as {@link getTripDetailByShareCode}, keyed by trip UUID (member check).
   */
  async getTripDetailByTripId(tripId: string, userId: string): Promise<TripDetailDto> {
    const trip = await this.getTripById(tripId, userId);

    const [routeResult, activitiesResult, weatherResult] = await Promise.all([
      this.tripLocationsService.getRoute(tripId, userId).then(
        (data) => ({ data }),
        (e: Error) => ({ error: e?.message ?? 'Failed to load locations' }),
      ),
      this.activitiesService.getActivitiesGroupedByLocation(tripId, userId).then(
        (data) => ({ data }),
        (e: Error) => ({ error: e?.message ?? 'Failed to load activities' }),
      ),
      this.weatherService.getTripWeather(tripId, userId, { days: 5 }).then(
        (data) => ({ data }),
        (e: Error) => ({ error: e?.message ?? 'Failed to load weather' }),
      ),
    ]);

    return {
      trip,
      route_locations: 'data' in routeResult ? routeResult.data : null,
      route_locations_error: 'error' in routeResult ? routeResult.error : undefined,
      grouped_activities: 'data' in activitiesResult ? activitiesResult.data : null,
      activities_error: 'error' in activitiesResult ? activitiesResult.error : undefined,
      weather: 'data' in weatherResult ? weatherResult.data : null,
      weather_error: 'error' in weatherResult ? weatherResult.error : undefined,
    };
  }

  async getTripDetailByShareCode(shareCode: string, userId: string): Promise<TripDetailDto> {
    const trip = await this.getTripByShareCode(shareCode, userId);
    const tripId = trip.id;

    const [routeResult, activitiesResult, weatherResult] = await Promise.all([
      this.tripLocationsService.getRoute(tripId, userId).then(
        (data) => ({ data }),
        (e: Error) => ({ error: e?.message ?? 'Failed to load locations' }),
      ),
      this.activitiesService.getActivitiesGroupedByLocation(tripId, userId).then(
        (data) => ({ data }),
        (e: Error) => ({ error: e?.message ?? 'Failed to load activities' }),
      ),
      this.weatherService.getTripWeather(tripId, userId, { days: 5 }).then(
        (data) => ({ data }),
        (e: Error) => ({ error: e?.message ?? 'Failed to load weather' }),
      ),
    ]);

    return {
      trip,
      route_locations: 'data' in routeResult ? routeResult.data : null,
      route_locations_error: 'error' in routeResult ? routeResult.error : undefined,
      grouped_activities: 'data' in activitiesResult ? activitiesResult.data : null,
      activities_error: 'error' in activitiesResult ? activitiesResult.error : undefined,
      weather: 'data' in weatherResult ? weatherResult.data : null,
      weather_error: 'error' in weatherResult ? weatherResult.error : undefined,
    };
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

  private getPublicAppUrl(): string {
    const trim = (u: string) => u.trim().replace(/\/+$/, '');
    const explicit = this.configService.get<string>('PUBLIC_APP_URL');
    if (explicit && explicit.trim()) return trim(explicit);
    const prod = this.configService.get<string>('FRONTEND_ORIGIN_PROD');
    if (prod && prod.trim()) return trim(prod);
    const dev = this.configService.get<string>('FRONTEND_ORIGIN_DEV');
    if (dev && dev.trim()) return trim(dev);
    return 'http://localhost:3000';
  }

  /**
   * Authenticated user joins a trip by share code (open join for v1).
   */
  async joinTripByShareCode(shareCode: string, userId: string): Promise<{
    ok: true;
    share_code: string;
    already_member: boolean;
  }> {
    const trip = await this.supabaseService.resolveTripForJoinByShareCodeParam(shareCode);
    if (!trip) {
      throw new NotFoundException('Trip not found');
    }

    const already = await this.supabaseService.isTripMember(trip.id, userId);
    if (already) {
      return { ok: true, share_code: trip.share_code, already_member: true };
    }

    try {
      await this.supabaseService.addTripMember(trip.id, userId);
    } catch (err: unknown) {
      const code =
        err !== null &&
        typeof err === 'object' &&
        'code' in err &&
        typeof (err as { code: unknown }).code === 'string'
          ? (err as { code: string }).code
          : '';
      if (code === '23505') {
        return { ok: true, share_code: trip.share_code, already_member: true };
      }
      this.logger.error('joinTripByShareCode: addTripMember failed', err);
      throw new BadRequestException('Could not join trip');
    }

    return { ok: true, share_code: trip.share_code, already_member: false };
  }

  /**
   * Trip member sends an invite email with a join link (Brevo transactional API).
   */
  async sendTripInviteEmail(tripId: string, inviterUserId: string, toEmail: string): Promise<{ ok: true }> {
    if (!this.mailService.isConfigured()) {
      throw new ServiceUnavailableException(
        'Email is not configured. Set BREVO_API_KEY and BREVO_SENDER_EMAIL on the server.',
      );
    }

    const trip = await this.supabaseService.getTrip(tripId, inviterUserId);
    if (!trip) {
      throw new ForbiddenException('Trip not found or access denied');
    }

    const shareCode =
      typeof trip.share_code === 'string' && trip.share_code.length > 0 ? trip.share_code : null;
    if (!shareCode) {
      throw new BadRequestException('Trip has no share code');
    }

    const tripTitle =
      typeof trip.title === 'string' && trip.title.trim().length > 0 ? trip.title.trim() : 'A trip on gotrippin';

    let inviterLabel = 'Someone';
    try {
      const profile = await this.supabaseService.getProfile(inviterUserId);
      const name = profile && typeof profile === 'object' && 'display_name' in profile
        ? profile.display_name
        : null;
      if (typeof name === 'string' && name.trim().length > 0) {
        inviterLabel = name.trim();
      }
    } catch (err) {
      this.logger.warn(`sendTripInviteEmail: could not load inviter profile (${inviterUserId})`, err);
    }

    const base = this.getPublicAppUrl();
    const joinUrl = `${base}/trips/${encodeURIComponent(shareCode)}/join`;

    const inviteParams = {
      appOrigin: base,
      joinUrl,
      tripTitle,
      inviterLabel,
    };

    await this.mailService.sendTransactionalEmail({
      to: toEmail.trim().toLowerCase(),
      subject: buildTripInviteEmailSubject(inviteParams),
      htmlContent: buildTripInviteEmailHtml(inviteParams),
      textContent: buildTripInviteEmailText(inviteParams),
    });

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

  async listTripGalleryImages(tripId: string, userId: string) {
    const trip = await this.supabaseService.getTrip(tripId, userId);
    if (!trip) {
      throw new ForbiddenException('Trip not found or access denied');
    }
    return this.supabaseService.listTripGalleryImages(tripId);
  }

  async addTripGalleryImageFromUnsplash(
    tripId: string,
    userId: string,
    input: CoverPhotoInput,
  ): Promise<TripGalleryImage> {
    const trip = await this.supabaseService.getTrip(tripId, userId);
    if (!trip) {
      throw new ForbiddenException('Trip not found or access denied');
    }

    const current = await this.supabaseService.countTripGalleryImages(tripId);
    if (current >= MAX_TRIP_GALLERY_IMAGES) {
      throw new BadRequestException(
        `You can upload at most ${MAX_TRIP_GALLERY_IMAGES} photos per trip`,
      );
    }

    const { storage_key, blur_hash } =
      await this.imagesService.downloadUnsplashImageToGalleryStorage(tripId, input);

    return this.supabaseService.insertTripGalleryImage({
      trip_id: tripId,
      storage_key,
      blur_hash,
      width: null,
      height: null,
      sort_order: current,
      created_by: userId,
    });
  }

  async setTripCoverFromGalleryImage(
    tripId: string,
    userId: string,
    galleryImageId: string,
  ) {
    const trip = await this.supabaseService.getTrip(tripId, userId);
    if (!trip) {
      throw new ForbiddenException('Trip not found or access denied');
    }

    const row = await this.supabaseService.getTripGalleryImageById(galleryImageId);
    if (!row || row.trip_id !== tripId) {
      throw new NotFoundException('Gallery image not found');
    }

    assertGalleryStorageKeyForTrip(tripId, row.storage_key);

    const photoId = await this.imagesService.getOrCreatePhotoRowForStorageKey(row.storage_key);
    const former = readFormerCoverForGalleryPromotion(trip);
    if (former) {
      await this.promoteFormerCoverIntoGalleryIfNeeded(tripId, userId, former, photoId);
    }
    return this.supabaseService.updateTrip(tripId, { cover_photo_id: photoId });
  }

  async addTripGalleryImage(tripId: string, userId: string, body: AddTripGalleryImageBody) {
    const trip = await this.supabaseService.getTrip(tripId, userId);
    if (!trip) {
      throw new ForbiddenException('Trip not found or access denied');
    }

    assertGalleryStorageKeyForTrip(tripId, body.storage_key);

    const current = await this.supabaseService.countTripGalleryImages(tripId);
    if (current >= MAX_TRIP_GALLERY_IMAGES) {
      throw new BadRequestException(
        `You can upload at most ${MAX_TRIP_GALLERY_IMAGES} photos per trip`,
      );
    }

    return this.supabaseService.insertTripGalleryImage({
      trip_id: tripId,
      storage_key: body.storage_key,
      blur_hash: body.blur_hash ?? null,
      width: body.width ?? null,
      height: body.height ?? null,
      sort_order: current,
      created_by: userId,
    });
  }

  async deleteTripGalleryImage(tripId: string, imageId: string, userId: string) {
    const trip = await this.supabaseService.getTrip(tripId, userId);
    if (!trip) {
      throw new ForbiddenException('Trip not found or access denied');
    }

    const row = await this.supabaseService.getTripGalleryImageById(imageId);
    if (!row || row.trip_id !== tripId) {
      throw new NotFoundException('Gallery image not found');
    }

    assertGalleryStorageKeyForTrip(tripId, row.storage_key);

    const cover = readTripCoverForSync(trip);
    const isCover = Boolean(cover && cover.storage_key === row.storage_key);

    if (isCover && cover) {
      const all = await this.supabaseService.listTripGalleryImages(tripId);
      const others = all.filter((g) => g.id !== imageId);
      if (others.length > 0) {
        const next = others[0];
        const newPhotoId = await this.imagesService.getOrCreatePhotoRowForStorageKey(
          next.storage_key,
        );
        await this.supabaseService.updateTrip(tripId, { cover_photo_id: newPhotoId });
      } else {
        await this.supabaseService.updateTrip(tripId, { cover_photo_id: null });
      }
      await this.imagesService.deletePhotoRowById(cover.id);
    }

    await this.imagesService.deleteR2Object(row.storage_key);
    await this.supabaseService.deleteTripGalleryImageRow(imageId);
    return { ok: true };
  }
}
