import type { CreateTripExpense, TripExpense, UpdateTripExpense } from "@gotrippin/core";
import { ApiError } from "./trips";
import { appConfig } from "@/config/appConfig";
import { getAuthToken } from "./auth";

const API_BASE_URL = appConfig.apiUrl;

/** Avoid hanging UI when the API is down or unreachable in dev. */
const TRIP_EXPENSES_FETCH_MS = 18_000;

function isAbortError(e: unknown): boolean {
  return e instanceof Error && e.name === "AbortError";
}

async function tripExpenseFetch(
  url: string,
  init: Omit<RequestInit, "signal">,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TRIP_EXPENSES_FETCH_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (e) {
    if (isAbortError(e)) {
      throw new ApiError("Request timed out — is the API running?", 408);
    }
    throw e;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function fetchTripExpenses(
  tripId: string,
  token?: string | null,
  filters?: { locationId?: string; activityId?: string }
): Promise<TripExpense[]> {
  const authToken = token ?? (await getAuthToken());
  if (!authToken) {
    throw new ApiError("Authentication required", 401);
  }
  const params = new URLSearchParams();
  if (filters?.locationId) params.set("location_id", filters.locationId);
  if (filters?.activityId) params.set("activity_id", filters.activityId);
  const q = params.toString();
  const url = `${API_BASE_URL}/trips/${tripId}/expenses${q ? `?${q}` : ""}`;
  const res = await tripExpenseFetch(url, {
    method: "GET",
    headers: { Authorization: `Bearer ${authToken}` },
    cache: "no-store",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Request failed" }));
    throw new ApiError(err.message || "Request failed", res.status);
  }
  return res.json();
}

export async function createTripExpense(
  tripId: string,
  body: CreateTripExpense,
  token?: string | null
): Promise<TripExpense> {
  const authToken = token ?? (await getAuthToken());
  if (!authToken) {
    throw new ApiError("Authentication required", 401);
  }
  const res = await tripExpenseFetch(`${API_BASE_URL}/trips/${tripId}/expenses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Request failed" }));
    throw new ApiError(err.message || "Request failed", res.status);
  }
  return res.json();
}

export async function updateTripExpense(
  tripId: string,
  expenseId: string,
  body: UpdateTripExpense,
  token?: string | null
): Promise<TripExpense> {
  const authToken = token ?? (await getAuthToken());
  if (!authToken) {
    throw new ApiError("Authentication required", 401);
  }
  const res = await tripExpenseFetch(
    `${API_BASE_URL}/trips/${tripId}/expenses/${expenseId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(body),
    }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Request failed" }));
    throw new ApiError(err.message || "Request failed", res.status);
  }
  return res.json();
}

export async function deleteTripExpense(
  tripId: string,
  expenseId: string,
  token?: string | null
): Promise<void> {
  const authToken = token ?? (await getAuthToken());
  if (!authToken) {
    throw new ApiError("Authentication required", 401);
  }
  const res = await tripExpenseFetch(
    `${API_BASE_URL}/trips/${tripId}/expenses/${expenseId}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${authToken}` },
    }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Request failed" }));
    throw new ApiError(err.message || "Request failed", res.status);
  }
}
