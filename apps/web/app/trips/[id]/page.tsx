import { redirect, notFound } from "next/navigation";
import { createServerSupabaseClient, getServerAuthToken } from "@/lib/supabase-server";
import { ApiError, fetchTripDetail } from "@/lib/api/trips";
import { normalizeTimelineData, type GroupedActivitiesResponse } from "@/lib/api/activities";
import type { Activity, TripLocation } from "@gotrippin/core";
import TripDetailPageClient from "./TripDetailPageClient";

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

export default async function TripDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    itinerary?: string;
    budget?: string;
    expenseLocation?: string;
    expenseActivity?: string;
  }>;
}) {
  const { id: shareCode } = await params;
  const query = await searchParams;
  const initialItineraryOpen =
    query.itinerary === "1" || query.itinerary === "true" || query.itinerary === "open";
  const budgetDeepLink =
    query.budget === "1" || query.budget === "true" || query.budget === "open";
  const hasExpenseParams =
    Boolean(query.expenseLocation?.trim()) || Boolean(query.expenseActivity?.trim());
  if (budgetDeepLink || hasExpenseParams) {
    const p = new URLSearchParams();
    if (query.expenseLocation?.trim()) {
      p.set("expenseLocation", query.expenseLocation.trim());
    }
    if (query.expenseActivity?.trim()) {
      p.set("expenseActivity", query.expenseActivity.trim());
    }
    redirect(`/trips/${shareCode}/budget${p.toString() ? `?${p.toString()}` : ""}`);
  }

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
    console.error("TripDetailPage: fetchTripDetail failed", err);
    throw err;
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
    ? normalizeTimelineData(detail.grouped_activities as GroupedActivitiesResponse)
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
      unassignedActivities={timelineRaw.unassigned}
      weatherByLocation={weatherByLocation}
      weatherFetchedAt={weather ? Date.now() : null}
      locationsError={locationsError}
      activitiesError={activitiesError}
      weatherError={weatherError}
      shareCode={shareCode}
      initialItineraryOpen={initialItineraryOpen}
    />
  );
}
