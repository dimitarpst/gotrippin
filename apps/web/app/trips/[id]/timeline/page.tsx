"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useTripTimeline } from "@/hooks/useTripTimeline";
import { useTrip } from "@/hooks/useTrips";
import { useTripWeather } from "@/hooks/useWeather";
import AuroraBackground from "@/components/effects/aurora-background";
import { Card } from "@/components/ui/card";
import { Calendar, ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { TripLocation } from "@gotrippin/core";

interface TimelinePageProps {
  params: Promise<{
    id: string;
  }>;
}

function dateLabel(location: TripLocation) {
  const formatter = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" });
  const arrival = location.arrival_date ? formatter.format(new Date(location.arrival_date)) : null;
  const departure = location.departure_date ? formatter.format(new Date(location.departure_date)) : null;
  if (arrival && departure) return `${arrival} → ${departure}`;
  if (arrival) return arrival;
  if (departure) return departure;
  return null;
}

export default function TimelinePage({ params }: TimelinePageProps) {
  const resolved = use(params);
  const shareCode = resolved.id;
  const router = useRouter();
  const { t } = useTranslation();

  const { trip, loading: tripLoading } = useTrip(shareCode);
  const tripId = trip?.id;
  const { locations, activitiesByLocation, unassigned, loading, error } = useTripTimeline(tripId);
  const {
    byLocation: weatherByLocation,
    loading: weatherLoading,
    error: weatherError,
  } = useTripWeather(tripId, 5);

  const isLoading = loading || tripLoading;

  const getWeatherLabel = (locationId: string) => {
    const entry = weatherByLocation[locationId];
    const forecast = entry?.weather?.forecast?.[0];
    if (forecast) {
      const temp =
        forecast.temperatureMax ??
        forecast.temperature ??
        forecast.temperatureMin ??
        null;
      const tempText = typeof temp === "number" ? `${Math.round(temp)}°` : "";
      return [tempText, forecast.description].filter(Boolean).join(" · ");
    }
    if (entry?.error) {
      return t("weather_unavailable", { defaultValue: "Weather unavailable" });
    }
    return null;
  };

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

        {isLoading && (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-24 rounded-2xl bg-white/5 border border-white/10 animate-pulse" />
            ))}
          </div>
        )}

        {!isLoading && error && (
          <Card className="p-4 border-white/10 bg-white/5 text-sm text-red-200">
            {error}
          </Card>
        )}

        {!isLoading && !error && weatherError && (
          <Card className="p-3 border-white/10 bg-white/5 text-xs text-red-200">
            {weatherError}
          </Card>
        )}

        {!isLoading && !error && (
          <div className="space-y-4">
            {locations.length === 0 && (
              <Card className="p-5 border-dashed border-white/15 bg-white/5 text-sm text-white/80">
                {t("trip_overview.route_empty")}
              </Card>
            )}

            {locations.map((loc, idx) => {
              const acts = activitiesByLocation[loc.id] || [];
              const label = dateLabel(loc);
              const weatherLabel = getWeatherLabel(loc.id);
              return (
                <Card
                  key={loc.id}
                  className="p-5 border-white/10 bg-white/5 backdrop-blur"
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
                        <span>{t("weather_loading", { defaultValue: "Loading weather..." })}</span>
                      )}
                      {!weatherLoading && weatherLabel && (
                        <span className="text-white/70 whitespace-nowrap">{weatherLabel}</span>
                      )}
                      <div className="w-2 h-2 rounded-full bg-[#ff6b6b]" />
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
              );
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
        )}
      </div>
    </main>
  );
}


