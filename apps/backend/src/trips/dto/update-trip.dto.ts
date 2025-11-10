import { TripUpdateDataSchema } from '@gotrippin/core';
import { z } from 'zod';

/**
 * DTO for updating an existing trip
 * Uses shared Zod schema from @gotrippin/core
 */
export class UpdateTripDto {
  title?: string;
  destination?: string;
  start_date?: string;
  end_date?: string;
  image_url?: string;
  description?: string;

  /**
   * Validates the data using Zod schema
   * Throws error if validation fails
   */
  static validate(data: unknown): z.infer<typeof TripUpdateDataSchema> {
    return TripUpdateDataSchema.parse(data);
  }

  /**
   * Safe validation that returns result object
   * Use this for graceful error handling
   */
  static safeParse(data: unknown) {
    return TripUpdateDataSchema.safeParse(data);
  }
}


