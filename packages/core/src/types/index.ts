/**
 * Shared TypeScript types and interfaces for gotrippin
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
  OpenMeteoForecastResponse,
  OpenMeteoGeocodingResponse,
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
// Trip expenses: TripExpense, CreateTripExpense, UpdateTripExpense from ../schemas/trip

