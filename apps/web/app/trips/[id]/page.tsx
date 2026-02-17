import { redirect, notFound } from "next/navigation";
import { createServerSupabaseClient, getServerAuthToken } from "@/lib/supabase-server";
import { fetchTripByShareCode } from "@/lib/api/trips";
import { getLocations } from "@/lib/api/trip-locations";
import type { Activity } from "@gotrippin/core";
import {
  getGroupedActivities,
  normalizeTimelineData,
} from "@/lib/api/activities";
import { getTripWeather } from "@/lib/api/weather";
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

  let trip: Awaited<ReturnType<typeof fetchTripByShareCode>> | null = null;
  let tripError: string | null = null;

  try {
    trip = await fetchTripByShareCode(shareCode, token);
  } catch {
    notFound();
  }

  if (!trip) {
    notFound();
  }

  const [routeLocations, timelineRaw, weather] = await Promise.all([
    getLocations(trip.id, token).catch(() => []),
    getGroupedActivities(trip.id, token)
      .then(normalizeTimelineData)
      .catch(() => ({
        locations: [],
        activitiesByLocation: {} as Record<string, Activity[]>,
        unassigned: [] as Activity[],
      })),
    getTripWeather(trip.id, 5, token).catch(() => null),
  ]);

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
      routeLocations={routeLocations}
      timelineLocations={timelineRaw.locations}
      activitiesByLocation={timelineRaw.activitiesByLocation}
      unassignedActivities={timelineRaw.unassigned}
      weatherByLocation={weatherByLocation}
      weatherFetchedAt={weather ? Date.now() : null}
      shareCode={shareCode}
    />
  );
}
