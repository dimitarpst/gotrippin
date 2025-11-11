/**
 * Validation utilities using shared Zod schemas
 * from @gotrippin/core
 */

import {
  ProfileUpdateDataSchema,
  TripCreateDataSchema,
  TripUpdateDataSchema,
  type Profile,
  type Trip,
  type TripCreateData,
  type TripUpdateData,
  type ProfileUpdateData,
} from '@gotrippin/core';
import { ZodError } from 'zod';

/**
 * Type for validation errors
 */
export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Format Zod errors into a user-friendly format
 */
export function formatZodErrors(error: ZodError): ValidationError[] {
  return error.issues.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
  }));
}

/**
 * Validate profile update data
 */
export function validateProfileUpdate(
  data: unknown
): { success: true; data: ProfileUpdateData } | { success: false; errors: ValidationError[] } {
  const result = ProfileUpdateDataSchema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  return { success: false, errors: formatZodErrors(result.error) };
}

/**
 * Validate trip creation data
 */
export function validateTripCreate(
  data: unknown
): { success: true; data: TripCreateData } | { success: false; errors: ValidationError[] } {
  const result = TripCreateDataSchema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  return { success: false, errors: formatZodErrors(result.error) };
}

/**
 * Validate trip update data
 */
export function validateTripUpdate(
  data: unknown
): { success: true; data: TripUpdateData } | { success: false; errors: ValidationError[] } {
  const result = TripUpdateDataSchema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  return { success: false, errors: formatZodErrors(result.error) };
}

/**
 * Type guards
 */
export function isValidProfile(data: unknown): data is Profile {
  // Note: This is just a basic check. Full validation would use ProfileSchema
  return typeof data === 'object' && data !== null && 'id' in data;
}

export function isValidTrip(data: unknown): data is Trip {
  // Note: This is just a basic check. Full validation would use TripSchema
  return typeof data === 'object' && data !== null && 'id' in data && 'user_id' in data;
}

/**
 * Export shared types for use in components
 */
export type {
  Profile,
  Trip,
  TripCreateData,
  TripUpdateData,
  ProfileUpdateData,
};


