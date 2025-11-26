/**
 * @gotrippin/core
 * Shared types, schemas, and utilities for Go Trippin'
 */

// Export Zod schemas
export {
  ProfileSchema,
  CreateProfileSchema,
  UpdateProfileSchema,
  ProfileUpdateDataSchema,
} from './schemas/profile';

export {
  TripSchema,
  TripMemberSchema,
  CreateTripSchema,
  UpdateTripSchema,
  TripUpdateDataSchema,
  TripCreateDataSchema,
  AddTripMemberSchema,
  RemoveTripMemberSchema,
  // Trip Location schemas
  TripLocationSchema,
  CreateTripLocationSchema,
  UpdateTripLocationSchema,
  ReorderLocationsSchema,
  // Activity schemas
  ActivityTypeEnum,
  ActivitySchema,
  CreateActivitySchema,
  UpdateActivitySchema,
} from './schemas/trip';

// Export TypeScript types
export type {
  Profile,
  CreateProfile,
  UpdateProfile,
  ProfileUpdateData,
} from './schemas/profile';

export type {
  Trip,
  TripMember,
  CreateTrip,
  UpdateTrip,
  TripUpdateData,
  TripCreateData,
  AddTripMember,
  RemoveTripMember,
  // Trip Location types
  TripLocation,
  CreateTripLocation,
  UpdateTripLocation,
  ReorderLocations,
  // Activity types
  ActivityType,
  Activity,
  CreateActivity,
  UpdateActivity,
} from './schemas/trip';

export type {
  ApiResponse,
  PaginatedResponse,
  AuthUser,
  Language,
  ThemeColor,
  Expense,
} from './types';

export type {
  TomorrowTimelineResponse,
  WeatherData,
} from './types/weather';

export {
  WEATHER_CODE_DESCRIPTIONS,
  getWeatherDescription,
} from './types/weather';

// Export utility functions
export { generateShareCode, isValidShareCode } from './utils/share-code';
