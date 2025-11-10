import { ProfileUpdateDataSchema } from '@gotrippin/core';
import { IsOptional, IsString, IsUrl, Matches, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';

/**
 * DTO for updating user profile
 * Uses shared Zod schema from @gotrippin/core
 */
export class UpdateProfileDto {
  @ApiProperty({ 
    required: false,
    example: 'John Doe',
    description: 'Display name'
  })
  @IsOptional()
  @IsString()
  display_name?: string;

  @ApiProperty({ 
    required: false,
    example: '#ff6b6b',
    description: 'Avatar color in hex format'
  })
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'Avatar color must be a valid hex color (e.g., #ff6b6b)' })
  avatar_color?: string;

  @ApiProperty({ 
    required: false,
    example: 'en',
    enum: ['en', 'bg'],
    description: 'Preferred language'
  })
  @IsOptional()
  @IsIn(['en', 'bg'], { message: 'Language must be either "en" or "bg"' })
  preferred_lng?: 'en' | 'bg';

  @ApiProperty({ 
    required: false,
    example: 'https://example.com/avatar.jpg',
    description: 'Avatar URL'
  })
  @IsOptional()
  @IsUrl({}, { message: 'Avatar URL must be a valid URL' })
  avatar_url?: string;

  /**
   * Validates the data using Zod schema
   * Throws error if validation fails
   */
  static validate(data: unknown): z.infer<typeof ProfileUpdateDataSchema> {
    return ProfileUpdateDataSchema.parse(data);
  }

  /**
   * Safe validation that returns result object
   * Use this for graceful error handling
   */
  static safeParse(data: unknown) {
    return ProfileUpdateDataSchema.safeParse(data);
  }
}


