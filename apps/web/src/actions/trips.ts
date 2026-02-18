"use server";

import type { Trip, TripCreateData, TripUpdateData } from "@gotrippin/core";
import { validateTripCreate, validateTripUpdate } from "@/lib/validation";
import { getServerAuthToken } from "@/lib/supabase-server";
import { appConfig } from "@/config/appConfig";

const API_BASE_URL = appConfig.apiUrl;

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; validationErrors?: Record<string, string> };

async function serverFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ActionResult<T>> {
  const token = await getServerAuthToken();
  if (!token) {
    return { success: false, error: "Authentication required" };
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
      const body = await response.json().catch(() => ({ message: "Request failed" }));
      const message = body.message || "Request failed";
      const validationErrors: Record<string, string> = {};
      if (body.errors?.validationErrors) {
        for (const e of body.errors.validationErrors) {
          if (e.field && e.message) validationErrors[e.field] = e.message;
        }
      }
      return {
        success: false,
        error: message,
        ...(Object.keys(validationErrors).length > 0 && { validationErrors }),
      };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (err) {
    if (err instanceof TypeError && API_BASE_URL) {
      const isLocalhost =
        API_BASE_URL.includes("localhost") || API_BASE_URL.includes("127.0.0.1");
      const message = isLocalhost
        ? "Backend server is not running. Please start it with 'npm run dev:backend'."
        : `Cannot connect to backend API.`;
      return { success: false, error: message };
    }
    return {
      success: false,
      error: err instanceof Error ? err.message : "Request failed",
    };
  }
}

export async function createTripAction(
  data: TripCreateData
): Promise<ActionResult<Trip>> {
  const validation = validateTripCreate(data);
  if (!validation.success) {
    const validationErrors = Object.fromEntries(
      validation.errors.map((e) => [e.field, e.message])
    );
    return { success: false, error: "Validation failed", validationErrors };
  }

  return serverFetch<Trip>("/trips", {
    method: "POST",
    body: JSON.stringify(validation.data),
  });
}

export async function updateTripAction(
  id: string,
  data: TripUpdateData
): Promise<ActionResult<Trip>> {
  const validation = validateTripUpdate(data);
  if (!validation.success) {
    const validationErrors = Object.fromEntries(
      validation.errors.map((e) => [e.field, e.message])
    );
    return { success: false, error: "Validation failed", validationErrors };
  }

  return serverFetch<Trip>(`/trips/${id}`, {
    method: "PUT",
    body: JSON.stringify(validation.data),
  });
}

export async function deleteTripAction(id: string): Promise<ActionResult<void>> {
  const result = await serverFetch<{ message: string }>(`/trips/${id}`, {
    method: "DELETE",
  });
  if (result.success) {
    return { success: true, data: undefined };
  }
  return result;
}
