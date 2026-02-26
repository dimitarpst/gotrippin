import type { CreateTripLocation, TripLocation, UpdateTripLocation, ReorderLocations } from "@gotrippin/core";
import { ApiError } from "./trips";
import { appConfig } from "@/config/appConfig";
import { getAuthToken } from "./auth";

// API base URL
const API_BASE_URL = appConfig.apiUrl;

/**
 * Add a location to a trip
 */
export async function addLocation(
  tripId: string,
  data: Omit<CreateTripLocation, "trip_id">,
  token?: string | null
): Promise<TripLocation> {
  const authToken = token ?? (await getAuthToken());

  if (!authToken) {
    throw new ApiError("Authentication required", 401);
  }

  const response = await fetch(`${API_BASE_URL}/trips/${tripId}/locations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
    // tripId is taken from the URL path; body should not include trip_id
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Request failed" }));
    throw new ApiError(error.message || "Request failed", response.status);
  }

  return response.json();
}

/**
 * Get all locations for a trip
 */
export async function getLocations(
  tripId: string,
  token?: string | null
): Promise<TripLocation[]> {
  const authToken = token ?? (await getAuthToken());

  if (!authToken) {
    throw new ApiError("Authentication required", 401);
  }

  const response = await fetch(`${API_BASE_URL}/trips/${tripId}/locations`, {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Request failed" }));
    throw new ApiError(error.message || "Request failed", response.status);
  }

  return response.json();
}

/**
 * Update a single trip location (partial update)
 */
export async function updateLocation(
  tripId: string,
  locationId: string,
  data: UpdateTripLocation,
  token?: string | null,
): Promise<TripLocation> {
  const authToken = token ?? (await getAuthToken());

  if (!authToken) {
    throw new ApiError("Authentication required", 401);
  }

  const response = await fetch(`${API_BASE_URL}/trips/${tripId}/locations/${locationId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Request failed" }));
    throw new ApiError(error.message || "Request failed", response.status);
  }

  return response.json();
}

/**
 * Reorder all locations for a trip
 */
export async function reorderLocations(
  tripId: string,
  payload: ReorderLocations,
  token?: string | null,
): Promise<{ message: string }> {
  const authToken = token ?? (await getAuthToken());

  if (!authToken) {
    throw new ApiError("Authentication required", 401);
  }

  const response = await fetch(`${API_BASE_URL}/trips/${tripId}/locations/reorder`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Request failed" }));
    throw new ApiError(error.message || "Request failed", response.status);
  }

  return response.json();
}


