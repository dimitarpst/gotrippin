import type { Activity, TripLocation } from "@gotrippin/core";
import { ApiError } from "./trips";
import { appConfig } from "@/config/appConfig";
import { getAuthToken } from "./auth";

const API_BASE_URL = appConfig.apiUrl;

export interface GroupedActivitiesResponse {
  locations: (TripLocation & { activities?: Activity[] | null })[];
  unassigned: Activity[];
}

export interface TimelineData {
  locations: TripLocation[];
  activitiesByLocation: Record<string, Activity[]>;
  unassigned: Activity[];
}

export type CreateActivityPayload = Pick<
  Activity,
  "title" | "notes" | "start_time" | "end_time" | "all_day" | "icon" | "color"
> & {
  type?: Activity["type"];
  location_id?: string | null;
};

export async function createActivity(
  tripId: string,
  payload: CreateActivityPayload,
  token?: string | null
): Promise<Activity> {
  const authToken = token ?? (await getAuthToken());

  if (!authToken) {
    throw new ApiError("Authentication required", 401);
  }

  const res = await fetch(`${API_BASE_URL}/trips/${tripId}/activities`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Request failed" }));
    throw new ApiError(error.message || "Request failed", res.status);
  }

  return res.json();
}

export async function getGroupedActivities(
  tripId: string,
  token?: string | null
): Promise<GroupedActivitiesResponse> {
  const authToken = token ?? (await getAuthToken());

  if (!authToken) {
    throw new ApiError("Authentication required", 401);
  }

  const res = await fetch(`${API_BASE_URL}/trips/${tripId}/activities/grouped`, {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Request failed" }));
    throw new ApiError(error.message || "Request failed", res.status);
  }

  return res.json();
}

export function normalizeTimelineData(
  payload: GroupedActivitiesResponse
): TimelineData {
  const activitiesByLocation: Record<string, Activity[]> = {};
  const locations: TripLocation[] = [];

  for (const loc of payload.locations || []) {
    locations.push({
      ...loc,
      // strip nested activities if present, TS will ignore extra fields on assign
    } as TripLocation);

    if (loc.activities && loc.activities.length > 0) {
      activitiesByLocation[loc.id] = [...loc.activities].sort((a, b) => {
        if (!a.start_time && !b.start_time) return 0;
        if (!a.start_time) return 1;
        if (!b.start_time) return -1;
        return new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
      });
    }
  }

  return {
    locations,
    activitiesByLocation,
    unassigned: payload.unassigned || [],
  };
}


