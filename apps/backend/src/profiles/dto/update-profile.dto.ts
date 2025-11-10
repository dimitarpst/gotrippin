import { ProfileUpdateDataSchema } from '@gotrippin/core';
import { z } from 'zod';

/**
 * DTO for updating user profile
 * Uses shared Zod schema from @gotrippin/core
 */
export class UpdateProfileDto {
  display_name?: string;
  avatar_color?: string;
  preferred_lng?: 'en' | 'bg';
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


