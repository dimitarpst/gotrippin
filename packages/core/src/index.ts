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
} from './schemas/trip';

export type {
  ApiResponse,
  PaginatedResponse,
  AuthUser,
  Language,
  ThemeColor,
  ActivityType,
  Activity,
  Expense,
} from './types';


