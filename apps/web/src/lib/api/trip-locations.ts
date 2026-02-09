import type { CreateTripLocation, TripLocation } from "@gotrippin/core";
import { ApiError } from "./trips";
import { appConfig } from "@/config/appConfig";

// API base URL
const API_BASE_URL = appConfig.apiUrl;

/**
 * Helper to get auth token (reused logic)
 * Ideally this should be exported from a shared auth-api module
 */
async function getAuthToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;

  try {
    const { supabase } = await import("@/lib/supabaseClient");
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) return session.access_token;
    
    // Fallback
    const sessionData = localStorage.getItem(
      "sb-" + process.env.NEXT_PUBLIC_SUPABASE_URL!.split("//")[1].split(".")[0] + "-auth-token"
    );
    if (sessionData) {
      const parsed = JSON.parse(sessionData);
      if (parsed?.access_token) return parsed.access_token;
    }
    return null;
  } catch (error) {
    console.error("Failed to get auth token:", error);
    return null;
  }
}

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

