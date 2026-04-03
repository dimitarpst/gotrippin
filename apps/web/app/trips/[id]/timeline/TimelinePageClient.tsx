"use client";

import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";
import { AlertCircle, ArrowLeft, ArrowRight, Plus } from "lucide-react";
import type { Activity, Trip, TripLocation, TripLocationWeather } from "@gotrippin/core";
import { formatTripDate } from "@gotrippin/core";

import AuroraBackground from "@/components/effects/aurora-background";
import WeatherWidget from "@/components/trips/weather-widget";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTripWeather } from "@/hooks/useWeather";
import { getLegColor, isSolidRouteColor } from "@/lib/route-colors";

function getLocationDateLabel(location: TripLocation) {
  const arrival = location.arrival_date ? new Date(location.arrival_date) : null;
  const departure = location.departure_date ? new Date(location.departure_date) : null;

  if (arrival && departure) {
    return (
      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted border border-border text-[11px] font-medium text-foreground shadow-inner dark:bg-black/20 dark:border-white/10 dark:text-white/80">
        <span>{format(arrival, "MMM d")}</span>
        <ArrowRight className="w-2.5 h-2.5 text-muted-foreground dark:text-white/40" />
        <span>{format(departure, "MMM d")}</span>
      </span>
    );
  }
  if (arrival) {
    return (
      <span className="px-2.5 py-1 rounded-md bg-muted border border-border text-[11px] font-medium text-foreground shadow-inner dark:bg-black/20 dark:border-white/10 dark:text-white/80">
        {format(arrival, "MMM d")}
      </span>
    );
  }
  if (departure) {
    return (
      <span className="px-2.5 py-1 rounded-md bg-muted border border-border text-[11px] font-medium text-foreground shadow-inner dark:bg-black/20 dark:border-white/10 dark:text-white/80">
        {format(departure, "MMM d")}
      </span>
    );
  }
  return null;
}

function renderLocationWeather(
  location: TripLocation,
  trip: Trip,
  weatherByLocation: Record<string, TripLocationWeather>,
  weatherLoading: boolean,
  t: (key: string, options?: Record<string, string | number>) => string,
) {
  const entry = weatherByLocation[location.id];
  const weather = entry?.weather;

  if (weatherLoading) {
    return (
      <span className="text-xs text-muted-foreground">
        {t("weather.loading", { defaultValue: "Loading weather..." })}
      </span>
    );
  }

  if (weather?.current) {
    return (
      <WeatherWidget
        variant="inline"
        minimal
        weather={{
          ...weather,
          location: location.location_name || trip.destination || weather.location,
        }}
      />
    );
  }

  if (entry?.error) {
    return (
      <span className="text-xs text-muted-foreground">
        {t("weather.unavailable", { defaultValue: "Weather unavailable" })}
      </span>
    );
  }

  return null;
}

export interface TimelinePageClientProps {
  trip: Trip;
  shareCode: string;
  locations: TripLocation[];
  activitiesByLocation: Record<string, Activity[]>;
}

export default function TimelinePageClient({
  trip,
  shareCode,
  locations,
  activitiesByLocation,
}: TimelinePageClientProps) {
  const router = useRouter();
  const { t } = useTranslation();

  const { byLocation: weatherByLocation, loading: weatherLoading, error: weatherError } = useTripWeather(
    trip.id,
    5,
  );

  const hasRoute = locations.length > 0;
  const startDate = trip.start_date ? formatTripDate(trip.start_date) : "—";
  const endDate = trip.end_date ? formatTripDate(trip.end_date) : "—";

  const tripTitle = trip.destination || trip.title || t("trips.untitled_trip");

  return (
    <main className="relative min-h-screen flex flex-col bg-[var(--color-background)] text-[var(--color-foreground)] overflow-hidden">
      <AuroraBackground />
      <div className="flex-1 relative z-10 px-4 pb-8 pt-4 sm:px-6">
        <header className="mb-6 flex items-center gap-3 sm:gap-4">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/trips/${shareCode}`)}
            className="h-12 w-12 shrink-0 rounded-full border border-white/20 bg-black/30 text-white backdrop-blur-md hover:bg-black/40 hover:text-white"
            aria-label={t("common.back", { defaultValue: "Back" })}
          >
            <ArrowLeft className="size-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 pr-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {t("trip_overview.route_title")}
                </p>
                <h1 className="mt-1 truncate text-lg font-semibold leading-tight tracking-tight text-foreground sm:text-xl">
                  {tripTitle}
                </h1>
              </div>
              <Badge
                variant="outline"
                className="h-7 shrink-0 gap-0 border-border/90 bg-muted/40 px-2.5 text-xs font-medium tabular-nums text-foreground shadow-none dark:border-white/14 dark:bg-white/[0.07]"
              >
                <span>{startDate}</span>
                <ArrowRight
                  className="mx-1.5 size-3 shrink-0 text-muted-foreground opacity-80 dark:text-white/50"
                  aria-hidden
                />
                <span>{endDate}</span>
              </Badge>
            </div>
          </div>
        </header>

        {weatherError ? (
          <Alert variant="destructive" className="mb-4 bg-destructive/10 border-destructive/20 p-3">
            <AlertCircle className="size-4" />
            <AlertDescription className="text-xs">{weatherError}</AlertDescription>
          </Alert>
        ) : null}

        {!hasRoute ? (
          <div className="flex items-center gap-3 rounded-2xl border border-dashed border-border bg-muted/40 px-4 py-3 dark:border-white/15 dark:bg-white/[0.02]">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted dark:bg-white/10">
              <Plus className="h-5 w-5 text-foreground dark:text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">{t("trip_overview.route_empty_title")}</p>
              <p className="text-xs text-muted-foreground">{t("trip_overview.route_empty")}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
              {locations.map((location, index) => {
                const acts = activitiesByLocation[location.id] || [];
                const dateLabel = getLocationDateLabel(location);
                const stopDotColor =
                  location.marker_color != null && isSolidRouteColor(location.marker_color)
                    ? location.marker_color
                    : getLegColor(index);

                return (
                  <div key={location.id} className="group flex gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className="mt-1 h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: stopDotColor }}
                      />
                      {index < locations.length - 1 ? (
                        <span className="mt-1 flex-1 w-px bg-border dark:bg-white/15" />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1 rounded-2xl border border-border bg-muted/35 shadow-sm transition-colors group-hover:border-primary/20 dark:border-white/[0.08] dark:bg-white/[0.04] dark:shadow-[0_8px_30px_rgba(0,0,0,0.25)] dark:group-hover:border-white/[0.15]">
                      <div
                        className="cursor-pointer rounded-t-2xl px-3 py-3 transition-colors hover:bg-muted/40 dark:px-4 dark:hover:bg-white/[0.03] sm:px-4"
                        onClick={() => router.push(`/trips/${shareCode}/timeline/${location.id}`)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            router.push(`/trips/${shareCode}/timeline/${location.id}`);
                          }
                        }}
                        role="button"
                        tabIndex={0}
                      >
                        <div className="mb-2 flex items-start justify-between gap-3">
                          <div className="mt-0.5 flex min-w-0 items-center gap-3">
                            <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                              {(index + 1).toString().padStart(2, "0")}
                            </span>
                            <p className="truncate text-lg font-semibold text-foreground">
                              {location.location_name || t("trips.untitled_trip")}
                            </p>
                          </div>
                          <div className="max-w-[min(100%,14rem)] shrink-0">
                            {renderLocationWeather(location, trip, weatherByLocation, weatherLoading, t)}
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                          {dateLabel ? <div className="whitespace-nowrap">{dateLabel}</div> : <div />}
                          <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground transition-colors group-hover:text-foreground/80 dark:text-white/40 dark:group-hover:text-white/60">
                            {t("trip_overview.view_all_days")}
                          </span>
                        </div>
                      </div>

                      <div className="border-t border-border px-3 pb-3 pt-0 dark:border-white/10 sm:px-4">
                        {acts.length === 0 ? (
                          <p className="pt-3 text-sm text-muted-foreground dark:text-white/60">
                            {t("trip_overview.no_activities_stop")}
                          </p>
                        ) : (
                          <ul className="space-y-2 pt-3">
                            {acts.map((act) => (
                              <li key={act.id}>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  className="h-auto w-full justify-between gap-3 rounded-xl border border-border bg-muted/50 px-3 py-2 text-left font-normal hover:bg-muted dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                                  onClick={() => router.push(`/trips/${shareCode}/activity/${act.id}/edit`)}
                                >
                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-medium text-foreground dark:text-white">
                                      {act.title}
                                    </p>
                                    {act.start_time ? (
                                      <p className="text-xs text-muted-foreground dark:text-white/60">
                                        {new Date(act.start_time).toLocaleTimeString([], {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })}
                                      </p>
                                    ) : null}
                                  </div>
                                  {act.type ? (
                                    <span className="shrink-0 text-[11px] uppercase tracking-wide text-muted-foreground dark:text-white/50">
                                      {act.type.replace("_", " ")}
                                    </span>
                                  ) : null}
                                </Button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </main>
  );
}
