import { redirect, notFound } from "next/navigation"
import { createServerSupabaseClient, getServerAuthToken } from "@/lib/supabase-server"
import { fetchTripByShareCode } from "@/lib/api/trips"
import { getGroupedActivities, normalizeTimelineData } from "@/lib/api/activities"
import { resolveTripCoverUrl } from "@/lib/r2"
import TimelineLocationPageClient from "./TimelineLocationPageClient"

export const dynamic = "force-dynamic"

export default async function TimelineLocationPage({
  params,
}: {
  params: Promise<{ id: string; locationId: string }>
}) {
  const { id: shareCode, locationId } = await params

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

  const { locations, activitiesByLocation } = normalizeTimelineData(grouped)
  const location = locations.find((loc) => loc.id === locationId) ?? null

  if (!location) {
    notFound()
  }

  return (
    <TimelineLocationPageClient
      trip={trip}
      shareCode={shareCode}
      locationId={locationId}
      locations={locations}
      activitiesByLocation={activitiesByLocation}
      location={location}
      coverImageUrl={resolveTripCoverUrl(trip)}
    />
  )
}
