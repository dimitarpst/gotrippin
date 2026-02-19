import { TripCreateDataSchema, CoverPhotoInputSchema } from '@gotrippin/core';
import { IsOptional, IsString, MaxLength, MinLength, IsISO8601, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';

export class CoverPhotoDto {
  @IsString() unsplash_photo_id: string;
  @IsString() download_location: string;
  @IsString() image_url: string;
  @IsString() photographer_name: string;
  @IsString() photographer_url: string;
  @IsOptional() @IsString() blur_hash?: string | null;
}

/**
 * DTO for creating a new trip
 * Uses shared Zod schema from @gotrippin/core
 */
export class CreateTripDto {
  @ApiProperty({ 
    required: false,
    example: 'Summer in Paris',
    description: 'Trip title (1-200 characters)'
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title?: string;

  @ApiProperty({ 
    required: false,
    example: 'Paris, France',
    description: 'Trip destination (1-200 characters)'
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  destination?: string;

  @ApiProperty({ 
    required: false,
    example: '2025-12-01T10:00:00.000Z',
    description: 'Trip start date (ISO 8601 format)'
  })
  @IsOptional()
  @IsISO8601({}, { message: 'Start date must be a valid ISO 8601 date' })
  start_date?: string;

  @ApiProperty({ 
    required: false,
    example: '2025-12-10T10:00:00.000Z',
    description: 'Trip end date (ISO 8601 format, must be after start date)'
  })
  @IsOptional()
  @IsISO8601({}, { message: 'End date must be a valid ISO 8601 date' })
  end_date?: string;

  @ApiProperty({ required: false, description: 'Unsplash cover photo metadata (downloaded to R2 at save time)' })
  @IsOptional()
  @ValidateNested()
  @Type(() => CoverPhotoDto)
  cover_photo?: CoverPhotoDto;

  @ApiProperty({ 
    required: false,
    example: '#ff6b6b',
    description: 'Trip color (hex code)'
  })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiProperty({ 
    required: false,
    example: 'Exploring the city of lights and enjoying French cuisine',
    description: 'Trip description (max 2000 characters)'
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  /**
   * Validates the data using Zod schema
   * Throws error if validation fails
   */
  static validate(data: unknown): z.infer<typeof TripCreateDataSchema> {
    return TripCreateDataSchema.parse(data);
  }

  static safeParse(data: unknown) {
    return TripCreateDataSchema.safeParse(data);
  }

  static validateCoverPhoto(data: unknown): z.infer<typeof CoverPhotoInputSchema> {
    return CoverPhotoInputSchema.parse(data);
  }
}


