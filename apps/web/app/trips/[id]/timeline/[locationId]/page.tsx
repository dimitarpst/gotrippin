"use client"

import { use } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { MapPin, ArrowLeft, Calendar, Navigation, Sparkles } from "lucide-react"
import AuroraBackground from "@/components/effects/aurora-background"
import WeatherWidget from "@/components/trips/weather-widget"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useTrip } from "@/hooks/useTrips"
import { useTripTimeline } from "@/hooks/useTripTimeline"
import { useTripWeather } from "@/hooks/useWeather"
import { useTranslation } from "react-i18next"
import type { TripLocation } from "@gotrippin/core"

interface RouteDetailPageProps {
  params: Promise<{
    id: string
    locationId: string
  }>
}

function formatDateRange(location?: TripLocation | null) {
  if (!location) return null
  const formatter = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" })
  const arrival = location.arrival_date ? formatter.format(new Date(location.arrival_date)) : null
  const departure = location.departure_date ? formatter.format(new Date(location.departure_date)) : null
  if (arrival && departure) return `${arrival} → ${departure}`
  if (arrival) return arrival
  if (departure) return departure
  return null
}

export default function RouteDetailPage({ params }: RouteDetailPageProps) {
  const { t } = useTranslation()
  const resolved = use(params)
  const shareCode = resolved.id
  const locationId = resolved.locationId
  const router = useRouter()

  const { trip, loading: tripLoading } = useTrip(shareCode)
  const {
    locations,
    activitiesByLocation,
    loading: timelineLoading,
    error: timelineError,
  } = useTripTimeline(trip?.id)
  const {
    byLocation: weatherByLocation,
    loading: weatherLoading,
    error: weatherError,
  } = useTripWeather(trip?.id, 5)

  const location = locations.find((loc) => loc.id === locationId) || null
  const activities = activitiesByLocation[locationId] || []
  const locationWeather = weatherByLocation[locationId]?.weather
  const dateLabel = formatDateRange(location)

  const handleBack = () => {
    router.push(`/trips/${shareCode}/timeline`)
  }

  const heroStyle = trip?.image_url
    ? {
        backgroundImage: `url(${trip.image_url})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : {
        background:
          "linear-gradient(135deg, rgba(255,107,107,0.55), rgba(109,118,255,0.45))",
      }

  return (
    <main className="relative min-h-screen flex flex-col bg-[var(--color-background)] text-[var(--color-foreground)] overflow-hidden">
      <AuroraBackground />
      <div className="relative z-10 px-4 py-4 sm:px-6 space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-2 text-sm font-semibold text-white/80 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("common.back", { defaultValue: "Back" })}
          </button>
          <div className="flex items-center gap-2 text-white/70 text-sm">
            <Sparkles className="w-4 h-4" />
            <span>{t("trip_overview.route_title")}</span>
          </div>
        </div>

        {(tripLoading || timelineLoading) && (
          <div className="space-y-3">
            {[0, 1].map((i) => (
              <div key={i} className="h-24 rounded-2xl bg-white/5 border border-white/10 animate-pulse" />
            ))}
          </div>
        )}

        {!timelineLoading && !location && (
          <Card className="p-5 border-white/10 bg-white/5 text-sm text-white/80">
            {timelineError || t("trip_overview.route_empty", { defaultValue: "This stop could not be found." })}
          </Card>
        )}

        {location && (
          <div className="space-y-6">
            {/* Hero / image band */}
            <motion.div
              className="relative overflow-hidden rounded-3xl border border-white/10 shadow-2xl"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 26 }}
            >
              <div className="absolute inset-0" style={heroStyle} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
              <div className="relative z-10 p-6 sm:p-8 flex flex-col gap-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center border border-white/20">
                      <MapPin className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-white text-xl font-bold leading-tight">
                        {location.location_name || t("trips.untitled_trip")}
                      </p>
                      {dateLabel && (
                        <p className="text-sm text-white/70 flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {dateLabel}
                        </p>
                      )}
                    </div>
                  </div>
                  {locationWeather && (
                    <WeatherWidget
                      weather={{
                        ...locationWeather,
                        location: location.location_name || locationWeather.location,
                      }}
                      variant="inline"
                    />
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    className="bg-[#ff6b6b] hover:bg-[#ff6b6b]/90 text-white font-semibold px-4"
                    onClick={() => router.push(`/trips/${shareCode}/activity`)}
                  >
                    {t("trip_overview.add_first_activity", { defaultValue: "Add activity" })}
                  </Button>
                  <Button
                    variant="outline"
                    className="border-white/30 text-white/90 backdrop-blur-md"
                    onClick={() => router.push(`/trips/${shareCode}/timeline`)}
                  >
                    {t("trip_overview.view_all_days", { defaultValue: "Back to timeline" })}
                  </Button>
                </div>
              </div>
            </motion.div>

            {/* Text + map bento (layout 1 inspired) */}
            <div className="grid gap-4 md:grid-cols-[1.4fr,1fr]">
              <motion.div
                className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-lg shadow-xl flex flex-col gap-4"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05, type: "spring", stiffness: 320, damping: 26 }}
              >
                <div className="flex items-center gap-2 text-white/70 text-sm">
                  <Navigation className="w-4 h-4" />
                  <span>{t("trip_overview.route_title")}</span>
                </div>
                <p className="text-lg font-semibold text-white">
                  {t("trip_overview.invite_guests_description", {
                    defaultValue: "Outline what happens at this stop and pin key details.",
                  })}
                </p>
                <p className="text-sm text-white/70 leading-relaxed">
                  {t("trip_overview.add_documents_description", {
                    defaultValue:
                      "Use this space to capture notes, meeting points, or context for travelers. You can attach activities, travel legs, and documents here.",
                  })}
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 rounded-full border border-white/10 text-xs text-white/70 bg-white/5">
                    {activities.length} {t("trip_overview.invite_guests", { defaultValue: "activities" })}
                  </span>
                  {dateLabel && (
                    <span className="px-3 py-1 rounded-full border border-white/10 text-xs text-white/70 bg-white/5">
                      {dateLabel}
                    </span>
                  )}
                  {weatherLoading && (
                    <span className="px-3 py-1 rounded-full border border-white/10 text-xs text-white/60 bg-white/5">
                      {t("weather_loading", { defaultValue: "Loading weather..." })}
                    </span>
                  )}
                  {!weatherLoading && weatherError && (
                    <span className="px-3 py-1 rounded-full border border-white/10 text-xs text-red-200/80 bg-white/5">
                      {weatherError}
                    </span>
                  )}
                </div>
              </motion.div>

              <motion.div
                className="relative rounded-3xl overflow-hidden border border-white/10 shadow-xl min-h-[260px] bg-white/5"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 320, damping: 26 }}
              >
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.08), transparent 40%), radial-gradient(circle at 80% 30%, rgba(109,118,255,0.12), transparent 35%), linear-gradient(135deg, rgba(0,0,0,0.35), rgba(0,0,0,0.6))",
                  }}
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white">
                  <div className="w-12 h-12 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-semibold">
                    {t("trip_overview.route_title", { defaultValue: "Route map" })}
                  </p>
                  <p className="text-xs text-white/70">{t("trip_overview.route_empty", { defaultValue: "Map coming soon" })}</p>
                </div>
              </motion.div>
            </div>

            {/* Weather + activities recap */}
            <div className="grid gap-4 md:grid-cols-[1.1fr,1fr]">
              <motion.div
                className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-lg shadow-xl"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, type: "spring", stiffness: 320, damping: 26 }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-white/70 text-sm">
                    <Calendar className="w-4 h-4" />
                    <span>{t("trip_overview.view_all_days")}</span>
                  </div>
                  <span className="text-[11px] uppercase tracking-wide text-white/50">
                    {t("trip_overview.route_title")}
                  </span>
                </div>
                {activities.length === 0 ? (
                  <p className="text-sm text-white/70">
                    {t("route_empty", { defaultValue: "No activities for this stop yet." })}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {activities.map((act) => (
                      <div
                        key={act.id}
                        className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 flex items-center justify-between"
                      >
                        <div>
                          <p className="text-white font-semibold text-sm">{act.title}</p>
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
              </motion.div>

              <motion.div
                className="rounded-3xl border border-white/10 bg-white/5 p-4 sm:p-5 backdrop-blur-lg shadow-xl"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 320, damping: 26 }}
              >
                {locationWeather ? (
                  <WeatherWidget
                    weather={{
                      ...locationWeather,
                      location: location.location_name || locationWeather.location,
                    }}
                    color={trip?.color || "#ff6b6b"}
                  />
                ) : (
                  <div className="text-sm text-white/70">
                    {weatherLoading
                      ? t("weather_loading", { defaultValue: "Loading weather..." })
                      : weatherError || t("weather_unavailable", { defaultValue: "Weather unavailable" })}
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}


