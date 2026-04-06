"use client"

import { useMemo } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { MapPin, ArrowLeft, Calendar, Navigation, Sparkles, ArrowRight, Map as MapIcon, Wallet } from "lucide-react"
import AuroraBackground from "@/components/effects/aurora-background"
import WeatherWidget from "@/components/trips/weather-widget"
import { WeatherUnavailableIndicator } from "@/components/trips/weather-unavailable-indicator"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MapView, tripLocationsToWaypoints } from "@/components/maps"
import { useTripWeather } from "@/hooks/useWeather"
import { useRouteDirections } from "@/hooks"
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

  const mapWaypoints = useMemo(() => tripLocationsToWaypoints(locations), [locations])
  const { routeGeo } = useRouteDirections(mapWaypoints)
  const mapboxToken =
    typeof process !== "undefined" ? process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN : undefined
  const canShowRouteMap = mapWaypoints.length > 0 && Boolean(mapboxToken)

  const handleBack = () => router.push(`/trips/${shareCode}?itinerary=1`)

  const heroStyle = coverImageUrl
    ? { backgroundImage: `url(${coverImageUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
    : { background: "linear-gradient(135deg, rgba(255, 118, 112,0.55), rgba(109,118,255,0.45))" }

  return (
    <main className="relative min-h-screen flex flex-col bg-[var(--color-background)] text-[var(--color-foreground)] overflow-hidden">
      <AuroraBackground />
      <div className="relative z-10 w-full space-y-4 px-6 pt-4 pb-8">
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

        <div className="space-y-4">
          <motion.div
            className="relative overflow-hidden rounded-3xl border border-white/10 shadow-xl"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
          >
            <div className="absolute inset-0" style={heroStyle} />
            <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/30 to-transparent" />
            <div className="relative z-10 flex flex-col gap-4 p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
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
                    {locationWeatherError ? (
                      <WeatherUnavailableIndicator
                        variant="bare"
                        detailsSrOnly={locationWeatherError}
                      />
                    ) : (
                      t("weather.no_data", { defaultValue: "No data" })
                    )}
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
              <div className="flex flex-wrap items-center gap-2">
                <Button className="bg-[#ff7670] hover:bg-[#ff7670]/90 text-white font-semibold px-4" onClick={() => router.push(`/trips/${shareCode}/activity`)}>
                  {t("trip_overview.add_first_activity", { defaultValue: "Add activity" })}
                </Button>
                <Button
                  variant="outline"
                  className="border-white/35 bg-black/30 text-white shadow-sm backdrop-blur-md hover:bg-black/45 hover:text-white focus-visible:ring-white/40 dark:border-white/30 dark:bg-white/10 dark:hover:bg-white/18 dark:hover:text-white"
                  onClick={() => router.push(`/trips/${shareCode}?itinerary=1`)}
                >
                  {t("trip_overview.view_all_days", { defaultValue: "Back to timeline" })}
                </Button>
                <Button
                  variant="outline"
                  className="border-white/35 bg-black/30 text-white shadow-sm backdrop-blur-md hover:bg-black/45 hover:text-white focus-visible:ring-white/40 dark:border-white/30 dark:bg-white/10 dark:hover:bg-white/18 dark:hover:text-white"
                  onClick={() =>
                    router.push(
                      `/trips/${shareCode}/budget?expenseLocation=${encodeURIComponent(locationId)}`,
                    )
                  }
                >
                  <Wallet className="h-4 w-4 mr-2" aria-hidden />
                  {t("timeline_location.add_expense_stop", { defaultValue: "Add expense here" })}
                </Button>
              </div>
            </div>
          </motion.div>

          <div className="grid gap-3 md:grid-cols-[1.4fr,1fr]">
            <motion.div
              className="flex flex-col gap-3 rounded-3xl border border-border bg-card/95 p-5 text-card-foreground shadow-lg backdrop-blur-lg dark:border-white/10 dark:bg-white/5"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05, type: "spring", stiffness: 320, damping: 26 }}
            >
              <div className="flex items-center gap-2 text-muted-foreground text-sm dark:text-white/70">
                <Navigation className="w-4 h-4" />
                <span>{t("timeline_location.context_section_label")}</span>
              </div>
              <p className="text-lg font-semibold text-foreground dark:text-white">
                {t("timeline_location.context_lead")}
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed dark:text-white/70">
                {t("timeline_location.context_body")}
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 rounded-full border border-border text-xs text-muted-foreground bg-muted/60 dark:border-white/10 dark:text-white/70 dark:bg-white/5">
                  {t("timeline_location.activities_count", { count: activities.length })}
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
              className="relative min-h-[260px] overflow-hidden rounded-3xl border border-border bg-muted/40 shadow-lg dark:border-white/10 dark:bg-white/5"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 320, damping: 26 }}
            >
              {canShowRouteMap ? (
                <button
                  type="button"
                  className="absolute inset-0 block h-full min-h-[260px] w-full cursor-pointer text-left group"
                  onClick={() => router.push(`/trips/${shareCode}/map`)}
                >
                  <div className="absolute inset-0 z-0 min-h-[260px] pointer-events-none group-hover:scale-[1.02] transition-transform duration-500 ease-out">
                    <MapView
                      className="min-h-[260px] h-full"
                      waypoints={mapWaypoints}
                      routeLineGeo={routeGeo}
                      fitToRoute
                      fitPadding={36}
                      interactive={false}
                    />
                    <div className="absolute inset-0 bg-black/35 group-hover:bg-black/25 transition-colors duration-300" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0e0b10]/90 via-[#0e0b10]/35 to-transparent" />
                  </div>
                  <div className="relative z-10 flex h-full min-h-[260px] flex-col items-center justify-end gap-2 px-4 pb-5 text-center pointer-events-none">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#ff7670] drop-shadow-md">
                      {t("trip_overview.route_map_title")}
                    </span>
                    <div className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-white/90 shadow-lg backdrop-blur-md group-hover:text-white">
                      <MapIcon className="h-4 w-4" aria-hidden />
                      <span className="text-[11px] font-bold uppercase tracking-widest">
                        {t("timeline_location.open_full_map")}
                      </span>
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                    </div>
                  </div>
                </button>
              ) : (
                <>
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
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-4 text-center text-foreground dark:text-white">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-primary/15 dark:border-white/20 dark:bg-white/15">
                      <MapPin className="h-6 w-6 text-primary dark:text-white" aria-hidden />
                    </div>
                    <p className="text-sm font-semibold">{t("trip_overview.route_map_title")}</p>
                    <p className="max-w-[220px] text-xs text-muted-foreground dark:text-white/70">
                      {mapboxToken
                        ? t("timeline_location.map_need_coordinates")
                        : t("timeline_location.map_unavailable")}
                    </p>
                  </div>
                </>
              )}
            </motion.div>
          </div>

          <div className="grid gap-3 md:grid-cols-[1.1fr,1fr]">
            <motion.div
              className="rounded-3xl border border-border bg-card/95 p-5 text-card-foreground shadow-lg backdrop-blur-lg dark:border-white/10 dark:bg-white/5"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, type: "spring", stiffness: 320, damping: 26 }}
            >
              <div className="mb-2 flex items-center justify-between">
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
                <div className="space-y-1.5">
                  {activities.map((act) => (
                    <div
                      key={act.id}
                      className="flex items-center gap-2 rounded-2xl border border-border bg-muted/50 px-2 py-2 transition-colors hover:bg-muted dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                    >
                      <button
                        type="button"
                        className="flex min-w-0 flex-1 cursor-pointer items-center justify-between gap-2 rounded-xl px-1 py-0.5 text-left"
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
                        {act.type ? (
                          <span className="shrink-0 text-[11px] uppercase tracking-wide text-muted-foreground dark:text-white/50">
                            {act.type.replace("_", " ")}
                          </span>
                        ) : null}
                      </button>
                      <button
                        type="button"
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-background/80 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground dark:border-white/15 dark:bg-white/10 dark:text-white/70 dark:hover:bg-white/15"
                        aria-label={t("timeline_location.add_expense_activity_a11y", {
                          defaultValue: "Add expense for this activity",
                        })}
                        onClick={() =>
                          router.push(
                            `/trips/${shareCode}/budget?expenseLocation=${encodeURIComponent(locationId)}&expenseActivity=${encodeURIComponent(act.id)}`,
                          )
                        }
                      >
                        <Wallet className="h-4 w-4" aria-hidden />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            <motion.div
              className="rounded-3xl border border-border bg-card/95 p-3 text-card-foreground shadow-lg backdrop-blur-lg sm:p-4 dark:border-white/10 dark:bg-white/5"
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
                  {weatherLoading ? (
                    t("weather.loading", { defaultValue: "Loading weather..." })
                  ) : (
                    <WeatherUnavailableIndicator
                      detailsSrOnly={locationWeatherError || weatherError || null}
                    />
                  )}
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
