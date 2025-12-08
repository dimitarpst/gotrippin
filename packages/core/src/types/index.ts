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
  TripLocation,
  CreateTripLocation,
  UpdateTripLocation,
  ReorderLocations,
  Activity,
  CreateActivity,
  UpdateActivity,
  ActivityType,
} from '../schemas/trip';

export type {
  WeatherData,
  TomorrowTimelineResponse,
  TripLocationWeather,
  TripWeatherResponse,
} from './weather';

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

// Activity and ActivityType are now exported from ../schemas/trip

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


