import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

interface UnsplashPhoto {
  id: string;
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

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.accessKey = this.configService.get<string>('UNSPLASH_ACCESS_KEY');
    if (!this.accessKey) {
      this.logger.error('UNSPLASH_ACCESS_KEY is not set in environment variables');
    }
  }

  async searchImages(query: string, page: number = 1, perPage: number = 9) {
    const cacheKey = `${query}_${page}_${perPage}`;
    
    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      this.logger.log(`Cache hit for: ${cacheKey}`);
      return cached.data;
    }

    // Call Unsplash API
    try {
      const url = 'https://api.unsplash.com/search/photos';
      const response = await firstValueFrom(
        this.httpService.get<UnsplashSearchResponse>(url, {
          params: { query, page, per_page: perPage },
          headers: { Authorization: `Client-ID ${this.accessKey}` },
        }),
      );

      const data = response.data;
      
      // Cache result
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
}

