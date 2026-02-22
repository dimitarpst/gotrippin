import { redirect, notFound } from "next/navigation"
import { createServerSupabaseClient, getServerAuthToken } from "@/lib/supabase-server"
import { fetchTripByShareCode } from "@/lib/api/trips"
import { getGroupedActivities, normalizeTimelineData } from "@/lib/api/activities"
import TimelinePageClient from "./TimelinePageClient"

export const dynamic = "force-dynamic"

export default async function TimelinePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: shareCode } = await params

  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth")
  }

  const token = await getServerAuthToken()
  if (!token) {
    redirect("/auth")
  }

  let trip
  try {
    trip = await fetchTripByShareCode(shareCode, token)
  } catch {
    notFound()
  }

  let grouped
  try {
    grouped = await getGroupedActivities(trip.id, token)
  } catch {
    notFound()
  }

  const { locations, activitiesByLocation, unassigned } = normalizeTimelineData(grouped)

  return (
    <TimelinePageClient
      trip={trip}
      shareCode={shareCode}
      locations={locations}
      activitiesByLocation={activitiesByLocation}
      unassigned={unassigned}
    />
  )
}
