/**
 * @gotrippin/core
 * Shared types, schemas, and utilities for gotrippin
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
  PhotoSchema,
  CoverPhotoInputSchema,
  TripGalleryImageSchema,
  AddTripGalleryImageBodySchema,
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
  TripExpenseSchema,
  CreateTripExpenseSchema,
  UpdateTripExpenseSchema,
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
  Photo,
  CoverPhotoInput,
  TripGalleryImage,
  AddTripGalleryImageBody,
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
  TripExpense,
  CreateTripExpense,
  UpdateTripExpense,
} from './schemas/trip';

export type {
  ApiResponse,
  PaginatedResponse,
  AuthUser,
  Language,
  ThemeColor,
} from './types';

export type {
  TomorrowTimelineResponse,
  WeatherData,
  TripLocationWeather,
  TripWeatherResponse,
} from './types/weather';

export {
  WEATHER_CODE_DESCRIPTIONS,
  getWeatherDescription,
} from './types/weather';

// Export utility functions
export { generateShareCode, isValidShareCode } from './utils/share-code';
export {
  formatTripDate,
  calculateDaysUntil,
  calculateDuration,
} from './utils/date';

export {
  averageRgbFromImageDataSampled,
  rgbToHex,
  type RgbaImageRegion,
} from './utils/cover-image-color';

