import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { NodeHttpHandler } from '@smithy/node-http-handler';
import * as https from 'https';
import { SupabaseService } from '../supabase/supabase.service';
import type { CoverPhotoInput } from '@gotrippin/core';

interface UnsplashPhoto {
  id: string;
  blur_hash: string | null;
  color: string | null;
  urls: {
    raw: string;
    full: string;
    regular: string;
    small: string;
    thumb: string;
  };
  links: {
    self: string;
    html: string;
    download: string;
    download_location: string;
  };
  user: {
    name: string;
    username: string;
    links: {
      html: string;
    };
  };
  alt_description: string | null;
}

export interface UnsplashSearchResponse {
  total: number;
  total_pages: number;
  results: UnsplashPhoto[];
}

interface CachedResult {
  data: UnsplashSearchResponse;
  timestamp: number;
}

@Injectable()
export class ImagesService {
  private readonly logger = new Logger(ImagesService.name);
  private readonly cache = new Map<string, CachedResult>();
  private readonly CACHE_TTL = 60 * 60 * 1000; // 1 hour
  private readonly accessKey: string;
  private readonly r2: S3Client;
  private readonly r2Bucket = 'cdn';
  private readonly r2PublicUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly supabaseService: SupabaseService,
  ) {
    this.accessKey = this.configService.get<string>('UNSPLASH_ACCESS_KEY');
    if (!this.accessKey) {
      this.logger.error('UNSPLASH_ACCESS_KEY is not set');
    }

    const accountId = this.configService.get<string>('R2_ACCOUNT_ID');
    const accessKeyId = this.configService.get<string>('R2_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>('R2_SECRET_ACCESS_KEY');
    this.r2PublicUrl = this.configService.get<string>('R2_PUBLIC_URL') ?? 'https://cdn.gotrippin.app';

    if (!accountId || !accessKeyId || !secretAccessKey) {
      this.logger.error('R2 credentials (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY) are not set');
    }

    const httpsAgent = new https.Agent({ keepAlive: true, minVersion: 'TLSv1.2', maxVersion: 'TLSv1.3' });
    this.r2 = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
      requestHandler: new NodeHttpHandler({ httpsAgent }),
    });
  }

  async getRandomPhoto(query = 'travel landscape'): Promise<UnsplashPhoto> {
    const url = 'https://api.unsplash.com/photos/random';
    const response = await firstValueFrom(
      this.httpService.get<UnsplashPhoto>(url, {
        params: { query, orientation: 'landscape' },
        headers: { Authorization: `Client-ID ${this.accessKey}` },
      }),
    );
    this.logger.log(`Fetched random photo: ${response.data.id}`);
    return response.data;
  }

  /**
   * Convenience: fetch a random travel photo and convert to CoverPhotoInput.
   * Used as the default cover when a trip is created without a user-selected photo.
   */
  async getRandomTravelCoverInput(): Promise<CoverPhotoInput> {
    const photo = await this.getRandomPhoto('travel landscape nature');
    return {
      unsplash_photo_id: photo.id,
      download_location: photo.links.download_location,
      image_url: photo.urls.regular,
      photographer_name: photo.user.name,
      photographer_url: photo.user.links.html,
      blur_hash: photo.blur_hash ?? null,
      dominant_color: photo.color ?? null,
    };
  }

  async searchImages(query: string, page: number = 1, perPage: number = 9) {
    const cacheKey = `${query}_${page}_${perPage}`;

    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      this.logger.log(`Cache hit for: ${cacheKey}`);
      return cached.data;
    }

    try {
      const url = 'https://api.unsplash.com/search/photos';
      const response = await firstValueFrom(
        this.httpService.get<UnsplashSearchResponse>(url, {
          params: { query, page, per_page: perPage },
          headers: { Authorization: `Client-ID ${this.accessKey}` },
        }),
      );

      const data = response.data;
      this.cache.set(cacheKey, { data, timestamp: Date.now() });
      this.logger.log(`Fetched ${data.results.length} images for query: ${query}`);

      return data;
    } catch (error) {
      this.logger.error(`Error fetching images: ${error.message}`);
      throw error;
    }
  }

  async trackDownload(downloadUrl: string) {
    try {
      await firstValueFrom(
        this.httpService.get(downloadUrl, {
          headers: { Authorization: `Client-ID ${this.accessKey}` },
        }),
      );
      this.logger.log(`Download tracked for URL: ${downloadUrl}`);
    } catch (error) {
      this.logger.error(`Error tracking download: ${error.message}`);
    }
  }

  /**
   * Given cover photo metadata from the frontend (Unsplash search result), ensure the image
   * is stored in R2 and a photos row exists. Returns the photo UUID to store as cover_photo_id.
   * Deduplicates by unsplash_photo_id — if the same Unsplash photo was already stored, reuses it.
   */
  async downloadAndStorePhoto(input: CoverPhotoInput): Promise<string> {
    const supabase = this.supabaseService.getClient();

    // Check for existing photo row (dedup)
    const { data: existing } = await supabase
      .from('photos')
      .select('id')
      .eq('unsplash_photo_id', input.unsplash_photo_id)
      .maybeSingle();

    if (existing) {
      this.logger.log(`Reusing existing photo ${existing.id} for unsplash_photo_id ${input.unsplash_photo_id}`);
      // Backfill blur_hash/dominant_color if client sent them and we're reusing an old row that might not have them
      const updates: { blur_hash?: string | null; dominant_color?: string | null } = {};
      if (input.blur_hash != null) updates.blur_hash = input.blur_hash;
      if (input.dominant_color != null) updates.dominant_color = input.dominant_color;
      if (Object.keys(updates).length > 0) {
        const { error: updateErr } = await supabase.from('photos').update(updates).eq('id', existing.id);
        if (updateErr) this.logger.warn(`Failed to backfill photo ${existing.id}: ${updateErr.message}`);
        else this.logger.log(`Backfilled photo ${existing.id} with ${Object.keys(updates).join(', ')}`);
      }
      void this.trackDownload(input.download_location);
      return existing.id;
    }

    // Download image from Unsplash CDN
    const imageRes = await fetch(input.image_url);
    if (!imageRes.ok) {
      throw new Error(`Failed to download Unsplash image: ${imageRes.status}`);
    }
    const buffer = Buffer.from(await imageRes.arrayBuffer());
    const contentType = imageRes.headers.get('content-type') ?? 'image/jpeg';

    // Upload to R2
    const storageKey = `trip-images/${input.unsplash_photo_id}.jpg`;
    await this.r2.send(new PutObjectCommand({
      Bucket: this.r2Bucket,
      Key: storageKey,
      Body: buffer,
      ContentType: contentType,
    }));
    this.logger.log(`Uploaded to R2: ${storageKey}`);

    // Create photos row
    const { data: photo, error } = await supabase
      .from('photos')
      .insert({
        storage_key: storageKey,
        source: 'unsplash',
        unsplash_photo_id: input.unsplash_photo_id,
        photographer_name: input.photographer_name,
        photographer_url: input.photographer_url,
        blur_hash: input.blur_hash ?? null,
        dominant_color: input.dominant_color ?? null,
      })
      .select('id')
      .single();

    if (error) throw new Error(`Failed to create photos row: ${error.message}`);

    // Track download (Unsplash requirement) — fire and forget
    void this.trackDownload(input.download_location);

    return photo.id;
  }
}
