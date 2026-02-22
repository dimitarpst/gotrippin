import { redirect, notFound } from "next/navigation"
import { createServerSupabaseClient, getServerAuthToken } from "@/lib/supabase-server"
import { fetchTripByShareCode } from "@/lib/api/trips"
import { getTripWeather } from "@/lib/api/weather"
import { resolveTripCoverUrl } from "@/lib/r2"
import WeatherPageClient from "./WeatherPageClient"
import type { TripWeatherResponse } from "@gotrippin/core"

export const dynamic = "force-dynamic"

export default async function WeatherPage({
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

  let initialWeather: TripWeatherResponse | null = null
  try {
    initialWeather = await getTripWeather(trip.id, 7, token)
  } catch {
    // Leave null; client will show error/retry
  }

  return (
    <WeatherPageClient
      trip={trip}
      shareCode={shareCode}
      initialWeather={initialWeather}
      coverImageUrl={resolveTripCoverUrl(trip)}
    />
  )
}
