/**
 * Shared TypeScript types and interfaces for Go Trippin'
 * Re-exports types from Zod schemas
 */

export type {
  Profile,
  CreateProfile,
  UpdateProfile,
  ProfileUpdateData,
} from '../schemas/profile';

export type {
  Trip,
  CreateTrip,
  UpdateTrip,
  TripUpdateData,
  TripCreateData,
} from '../schemas/trip';

/**
 * Common API response types
 */
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * Authentication types
 */
export interface AuthUser {
  id: string;
  email: string;
  role?: string;
}

/**
 * Language preferences
 */
export type Language = 'en' | 'bg';

/**
 * Theme colors
 */
export type ThemeColor = 'light' | 'dark';

/**
 * Future: Activity types for trip planning
 */
export type ActivityType =
  | 'flight'
  | 'accommodation'
  | 'restaurant'
  | 'attraction'
  | 'transport'
  | 'other';

export interface Activity {
  id: string;
  trip_id: string;
  type: ActivityType;
  title: string;
  notes?: string;
  timestamp?: string;
  created_at: string;
}

/**
 * Future: Expense tracking
 */
export interface Expense {
  id: string;
  trip_id: string;
  amount: number;
  category: string;
  note?: string;
  created_at: string;
}


