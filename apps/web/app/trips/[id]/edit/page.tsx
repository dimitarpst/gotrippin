import { redirect, notFound } from "next/navigation";
import { createServerSupabaseClient, getServerAuthToken } from "@/lib/supabase-server";
import { ApiError, fetchTripDetail } from "@/lib/api/trips";
import { normalizeTimelineData, type GroupedActivitiesResponse } from "@/lib/api/activities";
import type { Activity, TripLocation } from "@gotrippin/core";
import type { DatePickerTimelineContext } from "@/components/trips/date-picker";
import EditTripPageClient from "./EditTripPageClient";

export const dynamic = "force-dynamic";

async function fetchTripDetailWithRetry(shareCode: string, token: string) {
  try {
    return await fetchTripDetail(shareCode, token);
  } catch (err) {
    if (err instanceof ApiError && (err.statusCode === 500 || err.statusCode === 503)) {
      await new Promise((r) => setTimeout(r, 200));
      return await fetchTripDetail(shareCode, token);
    }
    throw err;
  }
}

export default async function EditTripPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: shareCode } = await params;

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/home");
  }

  const token = await getServerAuthToken();
  if (!token) {
    redirect("/home");
  }

  let detail;
  try {
    detail = await fetchTripDetailWithRetry(shareCode, token);
  } catch (err) {
    if (err instanceof ApiError && err.statusCode === 404) notFound();
    console.error("EditTripPage: fetchTripDetail failed", err);
    throw err;
  }

  if (!detail?.trip) {
    notFound();
  }

  const { trip } = detail;
  const routeLocations = (detail.route_locations ?? []) as TripLocation[];

  const timelineRaw = detail.grouped_activities
    ? normalizeTimelineData(detail.grouped_activities as GroupedActivitiesResponse)
    : {
        locations: [] as TripLocation[],
        activitiesByLocation: {} as Record<string, Activity[]>,
        unassigned: [] as Activity[],
      };

  const derivedLocations = timelineRaw.locations.length ? timelineRaw.locations : routeLocations;

  const datePickerTimelineContext: DatePickerTimelineContext = {
    locations: derivedLocations,
    activitiesByLocation: timelineRaw.activitiesByLocation,
    unassigned: timelineRaw.unassigned,
  };

  return (
    <EditTripPageClient
      trip={trip}
      shareCode={shareCode}
      datePickerTimelineContext={datePickerTimelineContext}
    />
  );
}
