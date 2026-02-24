import { redirect, notFound } from "next/navigation";
import { createServerSupabaseClient, getServerAuthToken } from "@/lib/supabase-server";
import { fetchTripDetail } from "@/lib/api/trips";
import { normalizeTimelineData } from "@/lib/api/activities";
import type { Activity, TripLocation } from "@gotrippin/core";
import TripDetailPageClient from "./TripDetailPageClient";

export const dynamic = "force-dynamic";

export default async function TripDetailPage({
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
    redirect("/auth");
  }

  const token = await getServerAuthToken();
  if (!token) {
    redirect("/auth");
  }

  let detail;
  try {
    detail = await fetchTripDetail(shareCode, token);
  } catch {
    notFound();
  }

  if (!detail?.trip) {
    notFound();
  }

  const { trip } = detail;
  const routeLocations = detail.route_locations ?? [];
  const locationsError = detail.route_locations_error ?? null;
  const activitiesError = detail.activities_error ?? null;
  const weatherError = detail.weather_error ?? null;

  const timelineRaw = detail.grouped_activities
    ? normalizeTimelineData(detail.grouped_activities as { locations: unknown[]; unassigned: unknown[] })
    : {
        locations: [],
        activitiesByLocation: {} as Record<string, Activity[]>,
        unassigned: [] as Activity[],
      };

  const weather = detail.weather;
  const weatherByLocation =
    weather?.locations?.reduce(
      (acc, loc) => {
        acc[loc.locationId] = loc;
        return acc;
      },
      {} as Record<string, (typeof weather.locations)[0]>
    ) ?? {};

  return (
    <TripDetailPageClient
      trip={trip}
      routeLocations={routeLocations as TripLocation[]}
      timelineLocations={timelineRaw.locations}
      activitiesByLocation={timelineRaw.activitiesByLocation}
      weatherByLocation={weatherByLocation}
      weatherFetchedAt={weather ? Date.now() : null}
      locationsError={locationsError}
      activitiesError={activitiesError}
      weatherError={weatherError}
      shareCode={shareCode}
    />
  );
}
