import { redirect, notFound } from "next/navigation";
import type { Metadata } from "next";
import { createServerSupabaseClient, getServerAuthToken } from "@/lib/supabase-server";
import { ApiError, fetchTripDetail } from "@/lib/api/trips";
import { normalizeTimelineData, type GroupedActivitiesResponse } from "@/lib/api/activities";
import type { Activity, TripLocation } from "@gotrippin/core";
import TripPrintView from "@/components/trips/trip-print-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Print trip",
  robots: { index: false, follow: false },
};

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

export default async function TripPrintPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ autoprint?: string }>;
}) {
  const { id: shareCode } = await params;
  const sp = await searchParams;
  const autoprint = sp.autoprint === "1" || sp.autoprint === "true";

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
    console.error("TripPrintPage: fetchTripDetail failed", err);
    throw err;
  }

  if (!detail?.trip) {
    notFound();
  }

  const { trip } = detail;
  const routeLocations = detail.route_locations ?? [];

  const timelineRaw = detail.grouped_activities
    ? normalizeTimelineData(detail.grouped_activities as GroupedActivitiesResponse)
    : {
        locations: [],
        activitiesByLocation: {} as Record<string, Activity[]>,
        unassigned: [] as Activity[],
      };

  return (
    <TripPrintView
      trip={trip}
      routeLocations={routeLocations as TripLocation[]}
      activitiesByLocation={timelineRaw.activitiesByLocation}
      unassignedActivities={timelineRaw.unassigned}
      shareCode={shareCode}
      autoprint={autoprint}
    />
  );
}
