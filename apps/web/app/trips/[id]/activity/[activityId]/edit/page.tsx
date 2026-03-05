import { redirect, notFound } from "next/navigation";
import { createServerSupabaseClient, getServerAuthToken } from "@/lib/supabase-server";
import { fetchTripByShareCode } from "@/lib/api/trips";
import { fetchActivities } from "@/lib/api/activities";
import EditActivityPageClient from "./EditActivityPageClient";

export const dynamic = "force-dynamic";

export default async function EditActivityPage({
  params,
}: {
  params: Promise<{ id: string; activityId: string }>;
}) {
  const { id: shareCode, activityId } = await params;

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

  let trip;
  try {
    trip = await fetchTripByShareCode(shareCode, token);
  } catch {
    notFound();
  }

  if (!trip) {
    notFound();
  }

  let activities;
  try {
    activities = await fetchActivities(trip.id, token);
  } catch {
    notFound();
  }

  const activity = activities.find((a: any) => a.id === activityId);
  if (!activity) {
    notFound();
  }

  return <EditActivityPageClient trip={trip} shareCode={shareCode} activity={activity} />;
}
