import type { TripWeatherResponse } from "@gotrippin/core";
import { ApiError } from "./trips";
import { appConfig } from "@/config/appConfig";
import { getAuthToken } from "./auth";

const API_BASE_URL = appConfig.apiUrl;

export async function getTripWeather(
  tripId: string,
  days?: number,
  token?: string | null
): Promise<TripWeatherResponse> {
  const authToken = token ?? (await getAuthToken());

  if (!authToken) {
    throw new ApiError("Authentication required", 401);
  }

  const params = new URLSearchParams();
  const safeDays =
    typeof days === "number" && Number.isFinite(days)
      ? Math.min(14, Math.max(1, Math.round(days)))
      : undefined;
  if (safeDays) params.set("days", safeDays.toString());

  const response = await fetch(
    `${API_BASE_URL}/trips/${tripId}/weather${params.toString() ? `?${params.toString()}` : ""}`,
    {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Request failed" }));
    throw new ApiError(error.message || "Request failed", response.status);
  }

  return response.json();
}

