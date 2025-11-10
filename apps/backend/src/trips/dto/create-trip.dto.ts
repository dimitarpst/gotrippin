import { TripCreateDataSchema } from '@gotrippin/core';
import { z } from 'zod';

/**
 * DTO for creating a new trip
 * Uses shared Zod schema from @gotrippin/core
 */
export class CreateTripDto {
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


