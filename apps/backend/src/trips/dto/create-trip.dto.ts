import { TripCreateDataSchema } from '@gotrippin/core';
import { IsOptional, IsString, IsUrl, MaxLength, MinLength, IsISO8601 } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';

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

  @ApiProperty({ 
    required: false,
    example: 'https://example.com/paris.jpg',
    description: 'Trip image URL'
  })
  @IsOptional()
  @IsUrl({}, { message: 'Image URL must be a valid URL' })
  image_url?: string;

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

  /**
   * Safe validation that returns result object
   * Use this for graceful error handling
   */
  static safeParse(data: unknown) {
    return TripCreateDataSchema.safeParse(data);
  }
}


