"use client"

import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { MapPin, ArrowLeft, Calendar, Navigation, Sparkles } from "lucide-react"
import AuroraBackground from "@/components/effects/aurora-background"
import WeatherWidget from "@/components/trips/weather-widget"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useTripWeather } from "@/hooks/useWeather"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import type { Trip, TripLocation, Activity } from "@gotrippin/core"

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

export interface TimelineLocationPageClientProps {
  trip: Trip
  shareCode: string
  locationId: string
  locations: TripLocation[]
  activitiesByLocation: Record<string, Activity[]>
  location: TripLocation
  /** Resolved R2 URL for trip cover (server-computed so client does not import r2) */
  coverImageUrl?: string | null
}

export default function TimelineLocationPageClient(props: TimelineLocationPageClientProps) {
  const { trip, shareCode, locationId, locations, activitiesByLocation, location, coverImageUrl } = props
  const { t } = useTranslation()
  const router = useRouter()

  const {
    byLocation: weatherByLocation,
    fetchedAt: weatherFetchedAt,
    loading: weatherLoading,
    error: weatherError,
    refetch: refetchWeather,
  } = useTripWeather(trip.id, 5)

  const activities = activitiesByLocation[locationId] || []
  const locationWeather = weatherByLocation[locationId]?.weather
  const locationWeatherError = weatherByLocation[locationId]?.error
  const dateLabel = formatDateRange(location)

  const handleBack = () => router.push(`/trips/${shareCode}/timeline`)

  const heroStyle = coverImageUrl
    ? { backgroundImage: `url(${coverImageUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
    : { background: "linear-gradient(135deg, rgba(255,107,107,0.55), rgba(109,118,255,0.45))" }

  return (
    <main className="relative min-h-screen flex flex-col bg-[var(--color-background)] text-[var(--color-foreground)] overflow-hidden">
      <AuroraBackground />
      <div className="relative z-10 px-4 py-4 sm:px-6 space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-2 text-sm font-semibold text-foreground/80 hover:text-foreground transition-colors dark:text-white/80 dark:hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("common.back", { defaultValue: "Back" })}
          </button>
          <div className="flex items-center gap-2 text-muted-foreground text-sm dark:text-white/70">
            <Sparkles className="w-4 h-4" />
            <span>{t("trip_overview.route_title")}</span>
          </div>
        </div>

        <div className="space-y-6">
          <motion.div
            className="relative overflow-hidden rounded-3xl border border-white/10 shadow-2xl"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
          >
            <div className="absolute inset-0" style={heroStyle} />
            <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/30 to-transparent" />
            <div className="relative z-10 p-6 sm:p-8 flex flex-col gap-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center border border-white/20">
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-white text-xl font-bold leading-tight">{location.location_name || t("trips.untitled_trip")}</p>
                    {dateLabel && (
                      <p className="text-sm text-white/70 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {dateLabel}
                      </p>
                    )}
                  </div>
                </div>
                {weatherLoading ? (
                  <div className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 backdrop-blur-sm dark:border-white/10 dark:bg-white/5 dark:text-white/80">
                    <div className="w-4 h-4 rounded bg-muted animate-pulse dark:bg-white/10" />
                    <div className="h-4 w-24 rounded bg-muted animate-pulse dark:bg-white/10" />
                  </div>
                ) : locationWeather?.current ? (
                  <WeatherWidget
                    weather={{ ...locationWeather, location: location.location_name || locationWeather.location }}
                    variant="inline"
                    updatedAt={weatherFetchedAt}
                    showMeta
                  />
                ) : (
                  <div className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 backdrop-blur-sm text-muted-foreground text-xs dark:border-white/10 dark:bg-white/5 dark:text-white/70">
                    {locationWeatherError ? t("weather.unavailable", { defaultValue: "Weather unavailable" }) : t("weather.no_data", { defaultValue: "No data" })}
                    <button
                      type="button"
                      className="underline decoration-dotted text-foreground/90 dark:text-white/80"
                      onClick={(e) => {
                        e.stopPropagation()
                        refetchWeather().catch((e: unknown) => toast.error("Retry failed", { description: e instanceof Error ? e.message : String(e) }))
                      }}
                    >
                      {t("weather.retry", { defaultValue: "Retry" })}
                    </button>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button className="bg-[#ff6b6b] hover:bg-[#ff6b6b]/90 text-white font-semibold px-4" onClick={() => router.push(`/trips/${shareCode}/activity`)}>
                  {t("trip_overview.add_first_activity", { defaultValue: "Add activity" })}
                </Button>
                <Button
                  variant="outline"
                  className="border-white/35 bg-black/30 text-white shadow-sm backdrop-blur-md hover:bg-black/45 hover:text-white focus-visible:ring-white/40 dark:border-white/30 dark:bg-white/10 dark:hover:bg-white/18 dark:hover:text-white"
                  onClick={() => router.push(`/trips/${shareCode}/timeline`)}
                >
                  {t("trip_overview.view_all_days", { defaultValue: "Back to timeline" })}
                </Button>
              </div>
            </div>
          </motion.div>

          <div className="grid gap-4 md:grid-cols-[1.4fr,1fr]">
            <motion.div
              className="rounded-3xl border border-border bg-card/95 p-6 text-card-foreground backdrop-blur-lg shadow-xl flex flex-col gap-4 dark:border-white/10 dark:bg-white/5"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05, type: "spring", stiffness: 320, damping: 26 }}
            >
              <div className="flex items-center gap-2 text-muted-foreground text-sm dark:text-white/70">
                <Navigation className="w-4 h-4" />
                <span>{t("trip_overview.route_title")}</span>
              </div>
              <p className="text-lg font-semibold text-foreground dark:text-white">
                {t("trip_overview.invite_guests_description", { defaultValue: "Outline what happens at this stop and pin key details." })}
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed dark:text-white/70">
                {t("trip_overview.add_documents_description", {
                  defaultValue: "Use this space to capture notes, meeting points, or context for travelers. You can attach activities, travel legs, and documents here.",
                })}
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 rounded-full border border-border text-xs text-muted-foreground bg-muted/60 dark:border-white/10 dark:text-white/70 dark:bg-white/5">
                  {activities.length} {t("trip_overview.invite_guests", { defaultValue: "activities" })}
                </span>
                {dateLabel && (
                  <span className="px-3 py-1 rounded-full border border-border text-xs text-muted-foreground bg-muted/60 dark:border-white/10 dark:text-white/70 dark:bg-white/5">
                    {dateLabel}
                  </span>
                )}
                {weatherLoading && (
                  <span className="px-3 py-1 rounded-full border border-border text-xs text-muted-foreground bg-muted/60 dark:border-white/10 dark:text-white/60 dark:bg-white/5">
                    {t("weather.loading", { defaultValue: "Loading weather..." })}
                  </span>
                )}
                {!weatherLoading && weatherError && (
                  <span className="px-3 py-1 rounded-full border border-destructive/30 text-xs text-destructive bg-destructive/10 dark:text-red-200/80 dark:border-white/10 dark:bg-white/5">
                    {weatherError}
                  </span>
                )}
              </div>
            </motion.div>

            <motion.div
              className="relative rounded-3xl overflow-hidden border border-border bg-muted/40 shadow-xl min-h-[260px] dark:border-white/10 dark:bg-white/5"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 320, damping: 26 }}
            >
              <div
                className="absolute inset-0 dark:hidden"
                style={{
                  background:
                    "radial-gradient(circle at 20% 20%, color-mix(in oklch, var(--brand-coral) 18%, white 82%), transparent 45%), radial-gradient(circle at 80% 30%, oklch(0.88 0.06 280 / 0.35), transparent 40%), linear-gradient(135deg, oklch(0.97 0.02 85), oklch(0.94 0.03 25))",
                }}
              />
              <div
                className="absolute inset-0 hidden dark:block"
                style={{
                  background:
                    "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.08), transparent 40%), radial-gradient(circle at 80% 30%, rgba(109,118,255,0.12), transparent 35%), linear-gradient(135deg, rgba(0,0,0,0.35), rgba(0,0,0,0.6))",
                }}
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-foreground dark:text-white">
                <div className="w-12 h-12 rounded-2xl bg-primary/15 border border-border flex items-center justify-center dark:bg-white/15 dark:border-white/20">
                  <MapPin className="w-6 h-6 text-primary dark:text-white" />
                </div>
                <p className="text-sm font-semibold">{t("trip_overview.route_title", { defaultValue: "Route map" })}</p>
                <p className="text-xs text-muted-foreground dark:text-white/70">
                  {t("trip_overview.route_empty", { defaultValue: "Map coming soon" })}
                </p>
              </div>
            </motion.div>
          </div>

          <div className="grid gap-4 md:grid-cols-[1.1fr,1fr]">
            <motion.div
              className="rounded-3xl border border-border bg-card/95 p-6 text-card-foreground backdrop-blur-lg shadow-xl dark:border-white/10 dark:bg-white/5"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, type: "spring", stiffness: 320, damping: 26 }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-muted-foreground text-sm dark:text-white/70">
                  <Calendar className="w-4 h-4" />
                  <span>{t("trip_overview.view_all_days")}</span>
                </div>
                <span className="text-[11px] uppercase tracking-wide text-muted-foreground dark:text-white/50">
                  {t("trip_overview.route_title")}
                </span>
              </div>
              {activities.length === 0 ? (
                <p className="text-sm text-muted-foreground dark:text-white/70">
                  {t("route_empty", { defaultValue: "No activities for this stop yet." })}
                </p>
              ) : (
                <div className="space-y-2">
                  {activities.map((act) => (
                    <div
                      key={act.id}
                      className="rounded-2xl border border-border bg-muted/50 px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-muted transition-colors dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                      onClick={() => router.push(`/trips/${shareCode}/activity/${act.id}/edit`)}
                    >
                      <div>
                        <p className="text-foreground font-semibold text-sm dark:text-white">{act.title}</p>
                        {act.start_time && (
                          <p className="text-xs text-muted-foreground dark:text-white/60">
                            {new Date(act.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        )}
                      </div>
                      {act.type && (
                        <span className="text-[11px] uppercase tracking-wide text-muted-foreground dark:text-white/50">
                          {act.type.replace("_", " ")}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            <motion.div
              className="rounded-3xl border border-border bg-card/95 p-4 sm:p-5 text-card-foreground backdrop-blur-lg shadow-xl dark:border-white/10 dark:bg-white/5"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 320, damping: 26 }}
            >
              {locationWeather ? (
                <WeatherWidget
                  weather={{ ...locationWeather, location: location.location_name || locationWeather.location }}
                  color={trip.color && !trip.color.startsWith("linear-gradient") ? trip.color : undefined}
                  updatedAt={weatherFetchedAt}
                  showMeta
                />
              ) : (
                <div className="text-sm text-muted-foreground dark:text-white/70">
                  {weatherLoading
                    ? t("weather.loading", { defaultValue: "Loading weather..." })
                    : locationWeatherError || weatherError || t("weather.unavailable", { defaultValue: "Weather unavailable" })}
                  {!weatherLoading && (
                    <div className="mt-3">
                      <button
                        type="button"
                        className="px-4 py-2 rounded-xl border border-border bg-muted text-sm font-semibold text-foreground hover:bg-muted/80 dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
                        onClick={() =>
                          refetchWeather().catch((e: unknown) =>
                            toast.error("Retry failed", { description: e instanceof Error ? e.message : String(e) })
                          )
                        }
                      >
                        {t("weather.retry", { defaultValue: "Retry" })}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </main>
  )
}
