"use client"

import { ChevronLeft, AlertCircle } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import type { Trip, TripWeatherResponse, TripLocationWeather } from "@gotrippin/core"
import { useTranslation } from "react-i18next"
import { formatStopDateRange, getUpdatedLabel } from "./weather-utils"
import { useRouter } from "next/navigation"

export interface WeatherPageChromeProps {
  trip: Trip
  shareCode: string
  weather: TripWeatherResponse | null
  selectedLocation: TripLocationWeather | null
  activeLocationId: string | null
  error: string | null
  initialWeather: TripWeatherResponse | null
  fetchedAt: number | null
  loading: boolean
  onRetry: () => void
  onSelectLocation: (id: string) => void
}

export default function WeatherPageChrome({
  trip,
  shareCode,
  weather,
  selectedLocation,
  activeLocationId,
  error,
  initialWeather,
  fetchedAt,
  loading,
  onRetry,
  onSelectLocation,
}: WeatherPageChromeProps) {
  const router = useRouter()
  const { t } = useTranslation()

  const locationLabel = selectedLocation?.locationName || trip?.destination || trip?.title || "Weather"
  const locationWeather = selectedLocation?.weather || null
  const current = locationWeather?.current
  const forecast = locationWeather?.forecast || []

  const updatedLabel = getUpdatedLabel(t, fetchedAt)
  const dateLabel = formatStopDateRange(selectedLocation?.arrivalDate ?? null, selectedLocation?.departureDate ?? null)
  const precipChance =
    typeof forecast?.[0]?.precipitationProbability === "number"
      ? Math.round(forecast[0]!.precipitationProbability)
      : null

  const hasError = !weather && (error || !initialWeather)

  return (
    <>
      <div className="flex items-center gap-4 mb-6 pt-2">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md active:scale-95 transition-transform hover:bg-white/20"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="flex flex-col">
          <h1 className="text-lg font-bold leading-tight">{locationLabel}</h1>
          <span className="text-xs text-white/60">
            {trip?.title ? trip.title : t("weather.insights", { defaultValue: "Weather Insights" })}
          </span>
        </div>
      </div>

      {(dateLabel || updatedLabel || typeof precipChance === "number") && (
        <div className="mb-6 flex flex-wrap gap-2">
          {dateLabel && (
            <span className="px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-xs text-white/70 backdrop-blur-sm">
              {dateLabel}
            </span>
          )}
          {updatedLabel && (
            <span className="px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-xs text-white/60 backdrop-blur-sm">
              {updatedLabel}
            </span>
          )}
          {typeof precipChance === "number" && (
            <span className="px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-xs text-white/70 backdrop-blur-sm">
              {t("weather.precip_chance", { defaultValue: "Precip {{percent}}%", percent: precipChance })}
            </span>
          )}
        </div>
      )}

      {hasError && (
        <div className="mb-6">
          <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 backdrop-blur-xl rounded-[24px] p-5">
            <AlertCircle className="size-4" />
            <AlertTitle>{t("weather.unavailable", { defaultValue: "Weather unavailable" })}</AlertTitle>
            <AlertDescription>
              <div className="text-xs text-white/70 mb-4">{error || t("weather.unavailable", { defaultValue: "Weather unavailable" })}</div>
              <div className="flex gap-3">
                <button
                  onClick={onRetry}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-sm font-semibold"
                >
                  {t("weather.retry", { defaultValue: "Retry" })}
                </button>
                <button
                  onClick={() => router.back()}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-semibold text-white/80"
                >
                  {t("common.back", { defaultValue: "Go back" })}
                </button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {!loading && weather?.locations && weather.locations.length === 0 && (
        <div className="mb-6">
          <Card className="border border-white/10 bg-white/5 backdrop-blur-xl rounded-[24px] p-5">
            <div className="text-sm font-semibold mb-2">
              {t("weather.add_stops_title", { defaultValue: "Add stops to see weather" })}
            </div>
            <div className="text-xs text-white/70">
              {t("weather.add_stops_body", {
                defaultValue: "Your trip route has no locations yet. Add at least one stop and come back here.",
              })}
            </div>
            <div className="mt-4">
              <button
                onClick={() => router.push(`/trips/${shareCode}/activity/route`)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-sm font-semibold"
              >
                {t("weather.edit_route", { defaultValue: "Edit route" })}
              </button>
            </div>
          </Card>
        </div>
      )}

      {weather?.locations && weather.locations.length > 1 && (
        <div className="mb-6 -mx-1">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide px-1">
            {weather.locations
              .slice()
              .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
              .map((loc) => {
                const isActive = loc.locationId === selectedLocation?.locationId
                const hasIssue = !!loc.error || !loc.weather?.current
                return (
                  <button
                    key={loc.locationId}
                    onClick={() => onSelectLocation(loc.locationId)}
                    className={[
                      "flex items-center gap-2 px-3 py-2 rounded-2xl border backdrop-blur-md transition-all whitespace-nowrap",
                      isActive ? "bg-white/20 border-white/20 shadow-lg" : "bg-white/5 border-white/10 hover:bg-white/10",
                    ].join(" ")}
                  >
                    <span className="text-xs font-bold text-white/70">{loc.orderIndex ?? "•"}</span>
                    <span className="text-xs font-semibold text-white">{loc.locationName}</span>
                    {hasIssue && <span className="text-[10px] font-bold text-amber-200/90">!</span>}
                  </button>
                )
              })}
          </div>
        </div>
      )}

      {selectedLocation?.error && (
        <div className="mb-6">
          <Alert variant="destructive" className="border-amber-200/20 bg-amber-200/5 backdrop-blur-xl rounded-[24px] p-5">
            <AlertCircle className="size-4 text-amber-200/90" />
            <AlertTitle className="text-amber-200/90">
              {t("weather.stop_error_title", { defaultValue: "Couldn't fetch weather for this stop" })}
            </AlertTitle>
            <AlertDescription>
              <div className="text-xs text-white/70 mb-2">{selectedLocation.error}</div>
              {selectedLocation.error.toLowerCase().includes("time traveler") && (
                <div className="text-xs text-white/60 mb-4">
                  {t("weather.stop_error_hint_dates", {
                    defaultValue: "This usually means the stop's date range is invalid. Check arrival/departure dates.",
                  })}
                </div>
              )}
              <div className="mt-4 flex gap-3">
                <button
                  onClick={onRetry}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-sm font-semibold text-white"
                >
                  {t("weather.retry", { defaultValue: "Retry" })}
                </button>
                <button
                  onClick={() => router.push(`/trips/${shareCode}/activity/route`)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-semibold text-white/80"
                >
                  {t("weather.check_route_dates", { defaultValue: "Check route dates" })}
                </button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      )}
    </>
  )
}
