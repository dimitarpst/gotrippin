/**
 * Trip API client
 * Handles all trip-related API calls with validation
 */

import type { Trip, TripCreateData, TripUpdateData, TripWeatherResponse } from "@gotrippin/core";
import { validateTripCreate, validateTripUpdate } from "@/lib/validation";
import { appConfig } from "@/config/appConfig";
import { getAuthToken } from "./auth";

// API base URL - configured via environment variables through appConfig
const API_BASE_URL = appConfig.apiUrl;

/**
 * API Error with structured response
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public errors?: Record<string, any>
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Make authenticated API request
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  providedToken?: string | null
): Promise<T> {
  const token = providedToken ?? (await getAuthToken());

  if (!token) {
    throw new ApiError("Authentication required", 401);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: "Request failed" }));
      throw new ApiError(
        error.message || "Request failed",
        response.status,
        error.errors
      );
    }

    return response.json();
  } catch (error) {
    // Handle network errors (backend not running, CORS, etc.)
    if (error instanceof TypeError) {
      const isLocalhost = API_BASE_URL.includes("localhost") || API_BASE_URL.includes("127.0.0.1");
      const message = isLocalhost
        ? `Backend server is not running. Please start it with 'npm run dev:backend' or 'npm run dev' to start both frontend and backend.`
        : `Cannot connect to backend API at ${API_BASE_URL}. Please check if the server is running.`;
      throw new ApiError(message, 503);
    }
    // Re-throw ApiError instances as-is
    if (error instanceof ApiError) {
      throw error;
    }
    // Wrap other errors
    throw new ApiError(
      error instanceof Error ? error.message : "Network request failed",
      503
    );
  }
}

/**
 * Fetch all trips for the current user
 */
export async function fetchTrips(token?: string | null): Promise<Trip[]> {
  return apiRequest<Trip[]>("/trips", undefined, token);
}

/**
 * Fetch a single trip by ID
 */
export async function fetchTripById(id: string, token?: string | null): Promise<Trip> {
  return apiRequest<Trip>(`/trips/${id}`, undefined, token);
}

/**
 * Fetch a single trip by share code
 */
export async function fetchTripByShareCode(shareCode: string, token?: string | null): Promise<Trip> {
  return apiRequest<Trip>(`/trips/share/${shareCode}`, undefined, token);
}

/** Response from GET /trips/share/:shareCode/detail (one request for detail screen; web + mobile) */
export interface TripDetailResponse {
  trip: Trip;
  route_locations: unknown[] | null;
  route_locations_error?: string;
  grouped_activities: { locations: unknown[]; unassigned: unknown[] } | null;
  activities_error?: string;
  weather: TripWeatherResponse | null;
  weather_error?: string;
}

/**
 * Fetch full trip detail (trip + locations + timeline + weather) in one request.
 * Used by trip detail page and mobile.
 */
export async function fetchTripDetail(shareCode: string, token?: string | null): Promise<TripDetailResponse> {
  return apiRequest<TripDetailResponse>(`/trips/share/${shareCode}/detail`, undefined, token);
}

/**
 * Persist extracted dominant color for the trip's cover photo (so next load has instant gradient).
 */
export async function updateTripCoverDominantColor(
  tripId: string,
  dominantColor: string,
  token?: string | null
): Promise<{ ok: boolean }> {
  return apiRequest<{ ok: boolean }>(`/trips/${tripId}/cover-dominant-color`, {
    method: "PATCH",
    body: JSON.stringify({ dominant_color: dominantColor }),
  }, token);
}

/**
 * Create a new trip with validation
 */
export async function createTrip(data: TripCreateData, token?: string | null): Promise<Trip> {
  // Validate data before sending
  const validation = validateTripCreate(data);

  if (!validation.success) {
    throw new ApiError("Validation failed", 400, {
      validationErrors: validation.errors,
    });
  }

  return apiRequest<Trip>(
    "/trips",
    {
      method: "POST",
      body: JSON.stringify(validation.data),
    },
    token
  );
}

/**
 * Update an existing trip with validation
 */
export async function updateTrip(
  id: string,
  data: TripUpdateData,
  token?: string | null
): Promise<Trip> {
  // Validate data before sending
  const validation = validateTripUpdate(data);

  if (!validation.success) {
    throw new ApiError("Validation failed", 400, {
      validationErrors: validation.errors,
    });
  }

  return apiRequest<Trip>(
    `/trips/${id}`,
    {
      method: "PUT",
      body: JSON.stringify(validation.data),
    },
    token
  );
}

/**
 * Delete a trip
 */
export async function deleteTrip(
  id: string,
  token?: string | null
): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(
    `/trips/${id}`,
    {
      method: "DELETE",
    },
    token
  );
}
