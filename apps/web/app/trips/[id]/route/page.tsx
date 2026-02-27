import { redirect, notFound } from "next/navigation";
import { createServerSupabaseClient, getServerAuthToken } from "@/lib/supabase-server";
import { ApiError, fetchTripDetail } from "@/lib/api/trips";
import type { TripLocation } from "@gotrippin/core";
import RouteMapPageClient from "./RouteMapPageClient";

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

export default async function RoutePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: { wizard?: string };
}) {
  const { id: shareCode } = await params;
  const isWizard = searchParams?.wizard === "1";

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
    detail = await fetchTripDetailWithRetry(shareCode, token);
  } catch (err) {
    // Only show 404 when backend truly says “not found”.
    if (err instanceof ApiError && err.statusCode === 404) notFound();
    console.error("RoutePage: fetchTripDetail failed", err);
    throw err;
  }

  if (!detail?.trip) {
    notFound();
  }

  const routeLocations = (detail.route_locations ?? []) as TripLocation[];

  return (
    <RouteMapPageClient
      trip={detail.trip}
      routeLocations={routeLocations}
      shareCode={shareCode}
      isWizard={isWizard}
    />
  );
}

