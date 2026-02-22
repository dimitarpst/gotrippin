"use client"

import { useRouter } from "next/navigation"
import { useTripWeather } from "@/hooks/useWeather"
import AuroraBackground from "@/components/effects/aurora-background"
import { Card } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Calendar, ArrowLeft, AlertTriangle, AlertCircle } from "lucide-react"
import { useTranslation } from "react-i18next"
import type { Trip, TripLocation, Activity } from "@gotrippin/core"

function dateLabel(location: TripLocation) {
  const formatter = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" })
  const arrival = location.arrival_date ? formatter.format(new Date(location.arrival_date)) : null
  const departure = location.departure_date ? formatter.format(new Date(location.departure_date)) : null
  if (arrival && departure) return `${arrival} → ${departure}`
  if (arrival) return arrival
  if (departure) return departure
  return null
}

function getUpdatedLabel(updatedAt?: number | null): string | null {
  if (typeof updatedAt !== "number" || !Number.isFinite(updatedAt)) return null
  const diffMs = Date.now() - updatedAt
  if (!Number.isFinite(diffMs) || diffMs < 0) return null
  const minutes = Math.floor(diffMs / 60000)
  if (minutes <= 0) return "0m"
  return `${minutes}m`
}

export interface TimelinePageClientProps {
  trip: Trip
  shareCode: string
  locations: TripLocation[]
  activitiesByLocation: Record<string, Activity[]>
  unassigned: Activity[]
}

export default function TimelinePageClient({
  trip,
  shareCode,
  locations,
  activitiesByLocation,
  unassigned,
}: TimelinePageClientProps) {
  const router = useRouter()
  const { t } = useTranslation()

  const {
    byLocation: weatherByLocation,
    fetchedAt: weatherFetchedAt,
    loading: weatherLoading,
    error: weatherError,
  } = useTripWeather(trip.id, 5)

  const getWeatherLabel = (locationId: string) => {
    const entry = weatherByLocation[locationId]
    const current = entry?.weather?.current
    const forecast = entry?.weather?.forecast?.[0]
    const temp =
      current?.temperature ??
      forecast?.temperatureMax ??
      forecast?.temperature ??
      forecast?.temperatureMin ??
      null
    const desc = current?.description ?? forecast?.description ?? null
    const precip =
      typeof forecast?.precipitationProbability === "number"
        ? Math.round(forecast.precipitationProbability)
        : null

    if (typeof temp === "number" || desc) {
      const tempVal =
        current?.temperature ??
        forecast?.temperatureMax ??
        forecast?.temperature ??
        forecast?.temperatureMin ??
        null
      const tempText = typeof tempVal === "number" ? `${Math.round(tempVal)}°` : ""
      const parts = [tempText, desc].filter(Boolean)
      if (typeof precip === "number" && precip > 0) parts.push(`${precip}%`)
      return parts.join(" · ")
    }
    if (entry?.error) {
      return t("weather.unavailable", { defaultValue: "Weather unavailable" })
    }
    return null
  }

  return (
    <main className="relative min-h-screen flex flex-col bg-[var(--color-background)] text-[var(--color-foreground)] overflow-hidden">
      <AuroraBackground />
      <div className="flex-1 relative z-10 px-4 py-4 sm:px-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => router.push(`/trips/${shareCode}`)}
            className="inline-flex items-center gap-2 text-sm font-semibold text-white/80 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("common.back", { defaultValue: "Back" })}
          </button>
          <div className="flex items-center gap-2 text-white/70 text-sm">
            <Calendar className="w-4 h-4" />
            <span>{t("trip_overview.route_title")}</span>
          </div>
        </div>

        {weatherError && (
          <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 mb-4 p-3">
            <AlertCircle className="size-4" />
            <AlertDescription className="text-xs">{weatherError}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          {locations.length === 0 && (
            <Card className="p-5 border-dashed border-white/15 bg-white/5 text-sm text-white/80">
              {t("trip_overview.route_empty")}
            </Card>
          )}

          {locations.map((loc, idx) => {
            const acts = activitiesByLocation[loc.id] || []
            const label = dateLabel(loc)
            const weatherLabel = getWeatherLabel(loc.id)
            const updatedShort = getUpdatedLabel(weatherFetchedAt)
            const hasIssue = !!weatherByLocation[loc.id]?.error
            return (
              <Card
                key={loc.id}
                className="p-5 border-white/10 bg-white/5 backdrop-blur cursor-pointer transition-colors hover:border-white/20"
                onClick={() => router.push(`/trips/${shareCode}/timeline/${loc.id}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    router.push(`/trips/${shareCode}/timeline/${loc.id}`)
                  }
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-white/60">
                      {(idx + 1).toString().padStart(2, "0")}
                    </span>
                    <div>
                      <p className="text-white font-semibold">{loc.location_name || t("trips.untitled_trip")}</p>
                      {label && <p className="text-xs text-white/60">{label}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-white/60">
                    {weatherLoading && (
                      <span>{t("weather.loading", { defaultValue: "Loading weather..." })}</span>
                    )}
                    {!weatherLoading && weatherLabel && (
                      <span className="text-white/70 whitespace-nowrap">{weatherLabel}</span>
                    )}
                    {!weatherLoading && !weatherLabel && (
                      <span className="text-white/50 whitespace-nowrap">
                        {t("weather.no_data", { defaultValue: "No data" })}
                      </span>
                    )}
                    {!weatherLoading && updatedShort && (
                      <span className="text-white/40 whitespace-nowrap">
                        {t("weather.updated_short", { defaultValue: "Updated {{time}}", time: updatedShort })}
                      </span>
                    )}
                    {hasIssue ? (
                      <AlertTriangle className="w-4 h-4 text-amber-200/90" />
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-[#ff6b6b]" />
                    )}
                  </div>
                </div>

                {acts.length === 0 ? (
                  <p className="text-sm text-white/60">{t("route_empty", { defaultValue: "No activities for this stop yet." })}</p>
                ) : (
                  <div className="space-y-2">
                    {acts.map((act) => (
                      <div
                        key={act.id}
                        className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 flex items-center justify-between"
                      >
                        <div>
                          <p className="text-white font-medium text-sm">{act.title}</p>
                          {act.start_time && (
                            <p className="text-xs text-white/60">
                              {new Date(act.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          )}
                        </div>
                        {act.type && (
                          <span className="text-[11px] uppercase tracking-wide text-white/50">
                            {act.type}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )
          })}

          {unassigned.length > 0 && (
            <Card className="p-5 border-white/10 bg-white/5">
              <p className="text-sm font-semibold text-white mb-2">
                {t("route_call_to_action", { defaultValue: "Unassigned activities" })}
              </p>
              <div className="space-y-2">
                {unassigned.map((act) => (
                  <div
                    key={act.id}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 flex items-center justify-between"
                  >
                    <p className="text-white text-sm font-medium">{act.title}</p>
                    {act.type && (
                      <span className="text-[11px] uppercase tracking-wide text-white/50">
                        {act.type}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </main>
  )
}
