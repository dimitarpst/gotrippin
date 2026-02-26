import { redirect, notFound } from "next/navigation";
import { createServerSupabaseClient, getServerAuthToken } from "@/lib/supabase-server";
import { fetchTripDetail } from "@/lib/api/trips";
import type { TripLocation } from "@gotrippin/core";
import RouteMapPageClient from "./RouteMapPageClient";

export const dynamic = "force-dynamic";

export default async function RoutePage({
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

  const routeLocations = (detail.route_locations ?? []) as TripLocation[];

  return (
    <RouteMapPageClient
      trip={detail.trip}
      routeLocations={routeLocations}
      shareCode={shareCode}
    />
  );
}

