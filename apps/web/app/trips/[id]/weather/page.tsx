"use client"

import { motion } from "framer-motion"
import {
  ChevronLeft,
  Wind,
  Droplets,
  Sun,
  Cloud,
  CloudRain,
  CloudSnow,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { useTrip } from "@/hooks/useTrips"
import { use, useEffect, useMemo, useState } from "react"
import { useTripWeather } from "@/hooks/useWeather"
import type { TripLocationWeather } from "@gotrippin/core"
import { useTranslation } from "react-i18next"

function getWeatherIcon(code?: number | null) {
  // Clear/Sunny
  if (code === 1000 || code === 1100) return Sun
  // Partly/Mostly Cloudy
  if (code === 1101 || code === 1102) return Cloud
  // Cloudy
  if (code === 1001) return Cloud
  // Rain
  if (typeof code === "number" && code >= 4000 && code <= 4201) return CloudRain
  // Snow
  if (typeof code === "number" && code >= 5000 && code <= 5101) return CloudSnow
  // Default
  return Cloud
}

function formatTemp(temp?: number | null): string {
  if (typeof temp !== "number" || !Number.isFinite(temp)) return "—"
  return `${Math.round(temp)}°`
}

function formatDayLabel(dateIso: string, index: number): string {
  if (index === 0) return "Today"
  const d = new Date(dateIso)
  if (Number.isNaN(d.getTime())) return "—"
  return d.toLocaleDateString("en-US", { weekday: "short" })
}

function formatStopDateRange(arrival?: string | null, departure?: string | null): string | null {
  const formatter = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" })
  const a = arrival ? new Date(arrival) : null
  const d = departure ? new Date(departure) : null
  const aOk = a && !Number.isNaN(a.getTime()) ? formatter.format(a) : null
  const dOk = d && !Number.isNaN(d.getTime()) ? formatter.format(d) : null
  if (aOk && dOk) return `${aOk} → ${dOk}`
  return aOk || dOk || null
}

function getUpdatedLabel(
  t: (key: string, options?: any) => string,
  updatedAt?: number | null
): string | null {
  if (typeof updatedAt !== "number" || !Number.isFinite(updatedAt)) return null
  const diffMs = Date.now() - updatedAt
  if (!Number.isFinite(diffMs) || diffMs < 0) return null
  const minutes = Math.floor(diffMs / 60000)
  if (minutes <= 0) return t("weather.updated_just_now", { defaultValue: "Updated just now" })
  return t("weather.updated", { defaultValue: "Updated {{minutes}}m ago", minutes })
}

interface WeatherPageProps {
    params: Promise<{
        id: string
    }>
}

export default function WeatherPage({ params }: WeatherPageProps) {
    const router = useRouter()
    const { t } = useTranslation()
    const resolvedParams = use(params)
    const shareCode = resolvedParams.id
    const { trip, loading: tripLoading, error: tripError } = useTrip(shareCode)
    const { weather, loading: weatherLoading, error: weatherError, refetch, fetchedAt } = useTripWeather(trip?.id, 7)
    const [mounted, setMounted] = useState(false)
    const [dominantColor, setDominantColor] = useState<string | null>(null)
    const [activeLocationId, setActiveLocationId] = useState<string | null>(null)

    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        if (activeLocationId) return
        if (!weather?.locations?.length) return

        // Prefer first stop that has weather; otherwise default to first stop
        const preferred = weather.locations.find(l => l.weather)?.locationId
        setActiveLocationId(preferred ?? weather.locations[0].locationId)
    }, [weather, activeLocationId])

    // Extract dominant color from trip image (like in trip-overview)
    useEffect(() => {
        if (!trip?.image_url) {
            setDominantColor(null)
            return
        }

        const img = new Image()
        img.crossOrigin = "Anonymous"
        img.src = trip.image_url

        img.onload = () => {
            const canvas = document.createElement("canvas")
            const ctx = canvas.getContext("2d")
            if (!ctx) return

            canvas.width = img.width
            canvas.height = img.height
            ctx.drawImage(img, 0, 0)

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
            const data = imageData.data
            let r = 0,
                g = 0,
                b = 0
            const sampleSize = 10

            for (let i = 0; i < data.length; i += 4 * sampleSize) {
                r += data[i]
                g += data[i + 1]
                b += data[i + 2]
            }

            const pixelCount = data.length / (4 * sampleSize)
            r = Math.round(r / pixelCount)
            g = Math.round(g / pixelCount)
            b = Math.round(b / pixelCount)

            const hexColor = `#${[r, g, b].map(x => {
                const hex = x.toString(16)
                return hex.length === 1 ? "0" + hex : hex
            }).join("")}`

            setDominantColor(hexColor)
        }

        img.onerror = () => {
            setDominantColor(null)
        }
    }, [trip?.image_url])

    if (!mounted || tripLoading) {
        return <div className="min-h-screen bg-[#0e0b10]" />
    }

    // Get theme color: use dominant color from image if available, otherwise use trip color, fallback to coral
    // Handle gradient colors - if trip.color is a gradient, use dominant color or fallback
    const isGradient = trip?.color ? trip.color.startsWith("linear-gradient") : false
    const safeTripColor = trip?.color && !isGradient ? trip.color : null
    const themeColor = trip?.image_url
        ? (dominantColor || safeTripColor || "#ff6b6b") // If image exists, prefer dominant color; never use gradient strings here
        : (safeTripColor || dominantColor || "#ff6b6b") // If no image, use trip color (unless gradient)

    const selectedLocation: TripLocationWeather | null = useMemo(() => {
        if (!weather?.locations?.length) return null
        return (
            weather.locations.find(l => l.locationId === activeLocationId) ??
            weather.locations[0] ??
            null
        )
    }, [weather, activeLocationId])

    const locationLabel = selectedLocation?.locationName || trip?.destination || trip?.title || "Weather"
    const locationWeather = selectedLocation?.weather || null
    const current = locationWeather?.current
    const forecast = locationWeather?.forecast || []
    const WeatherIcon = getWeatherIcon(current?.weatherCode)
    const updatedLabel = getUpdatedLabel(t, fetchedAt)
    const dateLabel = formatStopDateRange(selectedLocation?.arrivalDate ?? null, selectedLocation?.departureDate ?? null)
    const precipChance =
      typeof forecast?.[0]?.precipitationProbability === "number"
        ? Math.round(forecast[0]!.precipitationProbability)
        : null

    return (
        <div className="min-h-screen bg-[#0e0b10] text-white relative overflow-hidden">
            {/* Ambient Background Glow */}
            <div
                className="fixed top-[-20%] left-[-20%] w-[80%] h-[80%] rounded-full blur-[120px] opacity-30 pointer-events-none"
                style={{ background: themeColor }}
            />
            <div
                className="fixed bottom-[-20%] right-[-20%] w-[80%] h-[80%] rounded-full blur-[120px] opacity-20 pointer-events-none"
                style={{ background: themeColor }}
            />

            <div className="relative z-10 p-4 pb-20 max-w-lg mx-auto">
                {/* Header */}
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

                {/* Selected stop meta row */}
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

                {/* Error / Empty states */}
                {(tripError || weatherError) && (
                    <div className="mb-6">
                        <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 backdrop-blur-xl rounded-[24px] p-5">
                            <AlertCircle className="size-4" />
                            <AlertTitle>{t("weather.unavailable", { defaultValue: "Weather unavailable" })}</AlertTitle>
                            <AlertDescription>
                                <div className="text-xs text-white/70 mb-4">
                                    {tripError || weatherError}
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => refetch().catch(() => {})}
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

                {!weatherLoading && weather?.locations && weather.locations.length === 0 && (
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

                {/* Location selector */}
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
                                            onClick={() => setActiveLocationId(loc.locationId)}
                                            className={[
                                                "flex items-center gap-2 px-3 py-2 rounded-2xl border backdrop-blur-md transition-all whitespace-nowrap",
                                                isActive
                                                    ? "bg-white/20 border-white/20 shadow-lg"
                                                    : "bg-white/5 border-white/10 hover:bg-white/10",
                                            ].join(" ")}
                                        >
                                            <span className="text-xs font-bold text-white/70">
                                                {loc.orderIndex ?? "•"}
                                            </span>
                                            <span className="text-xs font-semibold text-white">
                                                {loc.locationName}
                                            </span>
                                            {hasIssue && (
                                                <span className="text-[10px] font-bold text-amber-200/90">
                                                    !
                                                </span>
                                            )}
                                        </button>
                                    )
                                })}
                        </div>
                    </div>
                )}

                {/* Per-stop warning */}
                {selectedLocation?.error && (
                    <div className="mb-6">
                        <Alert variant="destructive" className="border-amber-200/20 bg-amber-200/5 backdrop-blur-xl rounded-[24px] p-5">
                            <AlertCircle className="size-4 text-amber-200/90" />
                            <AlertTitle className="text-amber-200/90">{t("weather.stop_error_title", { defaultValue: "Couldn’t fetch weather for this stop" })}</AlertTitle>
                            <AlertDescription>
                                <div className="text-xs text-white/70 mb-2">
                                    {selectedLocation.error}
                                </div>
                                {selectedLocation.error.toLowerCase().includes("time traveler") && (
                                    <div className="text-xs text-white/60 mb-4">
                                        {t("weather.stop_error_hint_dates", {
                                          defaultValue: "This usually means the stop’s date range is invalid. Check arrival/departure dates.",
                                        })}
                                    </div>
                                )}
                                <div className="mt-4 flex gap-3">
                                    <button
                                        onClick={() => refetch().catch(() => {})}
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

                {/* Hero Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <Card
                        className="border-0 overflow-hidden relative rounded-[32px] shadow-2xl p-8"
                        style={{
                            background: `linear-gradient(135deg, ${themeColor} 0%, ${themeColor}aa 100%)`
                        }}
                    >
                        {/* Glass shine effect */}
                        <div className="absolute top-0 left-0 right-0 h-1/2 bg-linear-to-b from-white/10 to-transparent pointer-events-none" />

                        <div className="relative z-10  flex flex-col items-center justify-center text-center">
                            {/* Large Weather Icon with colored background */}
                            <motion.div
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.2, type: "spring" }}
                                className="relative mb-6"
                            >
                                <div
                                    className="w-32 h-32 rounded-3xl flex items-center justify-center backdrop-blur-sm border border-white/10"
                                    style={{ background: `${themeColor}40` }}
                                >
                                    <WeatherIcon className="w-20 h-20 text-white drop-shadow-lg" />
                                </div>
                            </motion.div>

                            <h2 className="text-8xl font-bold tracking-tighter mb-3 drop-shadow-sm">
                                {formatTemp(current?.temperature)}
                            </h2>
                            <p className="text-xl font-medium opacity-90 mb-6">
                                {current?.description ||
                                  (weatherLoading
                                    ? t("trip_overview.weather_loading", { defaultValue: "Loading weather..." })
                                    : t("weather.no_data", { defaultValue: "No data" }))}
                            </p>

                            {/* Metrics Grid */}
                            <div className="grid grid-cols-3 gap-3 w-full max-w-sm">
                                <div className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-black/10 backdrop-blur-sm border border-white/10">
                                    <div
                                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                                        style={{ background: `${themeColor}40` }}
                                    >
                                        <Wind className="w-5 h-5 text-white" />
                                    </div>
                                    <span className="text-xs text-white/60 font-medium">{t("weather.wind", { defaultValue: "Wind" })}</span>
                                    <span className="text-sm font-bold">
                                        {typeof current?.windSpeed === "number" ? `${Math.round(current.windSpeed)} km/h` : "—"}
                                    </span>
                                </div>
                                <div className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-black/10 backdrop-blur-sm border border-white/10">
                                    <div
                                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                                        style={{ background: `${themeColor}40` }}
                                    >
                                        <Droplets className="w-5 h-5 text-white" />
                                    </div>
                                    <span className="text-xs text-white/60 font-medium">{t("weather.humidity", { defaultValue: "Humidity" })}</span>
                                    <span className="text-sm font-bold">
                                        {typeof current?.humidity === "number" ? `${Math.round(current.humidity)}%` : "—"}
                                    </span>
                                </div>
                                <div className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-black/10 backdrop-blur-sm border border-white/10">
                                    <div
                                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                                        style={{ background: `${themeColor}40` }}
                                    >
                                        <Sun className="w-5 h-5 text-white" />
                                    </div>
                                    <span className="text-xs text-white/60 font-medium">{t("weather.uv", { defaultValue: "UV" })}</span>
                                    <span className="text-sm font-bold">
                                        {typeof current?.uvIndex === "number" ? Math.round(current.uvIndex).toString() : "—"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </Card>
                </motion.div>

                {/* Next Days - Pill Style */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="mb-8"
                >
                    <div className="flex justify-between overflow-x-auto pb-4 scrollbar-hide gap-3 px-1">
                        {(forecast.slice(0, 6).length ? forecast.slice(0, 6) : new Array(6).fill(null)).map((day, i) => {
                            const DayIcon = getWeatherIcon(day?.weatherCode)
                            const active = i === 0
                            const label = day?.date ? formatDayLabel(day.date, i) : "—"
                            const temp = day?.temperature ?? day?.temperatureMax ?? day?.temperatureMin
                            const chance = typeof day?.precipitationProbability === "number"
                                ? Math.round(day.precipitationProbability)
                                : null
                            return (
                            <div
                                key={i}
                                className={`
                  flex flex-col items-center gap-3 min-w-[64px] py-4 rounded-[20px] border backdrop-blur-md transition-all
                  ${active
                                        ? 'bg-white/20 border-white/20 shadow-lg scale-105'
                                        : 'bg-white/5 border-white/5 hover:bg-white/10'}
                `}
                            >
                                <span className="text-xs font-medium text-white/70">{label}</span>
                                <DayIcon className={`w-6 h-6 ${active ? 'text-white' : 'text-white/80'}`} />
                                <span className="text-lg font-bold">{formatTemp(temp)}</span>
                                {chance !== null && chance > 0 && (
                                  <span className="text-[10px] font-bold text-blue-200">{chance}%</span>
                                )}
                            </div>
                        )})}
                    </div>
                </motion.div>

                {/* 7-Day Forecast - Clean List */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mb-8"
                >
                    <div className="bg-white/5 backdrop-blur-xl rounded-[32px] p-6 border border-white/5">
                        <h3 className="text-sm font-bold text-white/50 mb-6 uppercase tracking-wider ml-1">
                          {t("weather.seven_day", { defaultValue: "7-Day Forecast" })}
                        </h3>
                        <div className="space-y-6">
                            {(forecast.slice(0, 7).length ? forecast.slice(0, 7) : new Array(7).fill(null)).map((day, i) => {
                                const DayIcon = getWeatherIcon(day?.weatherCode)
                                const label = day?.date ? formatDayLabel(day.date, i) : "—"
                                const low = day?.temperatureMin ?? day?.temperature
                                const high = day?.temperatureMax ?? day?.temperature
                                const rain = typeof day?.precipitationProbability === "number"
                                    ? Math.round(day.precipitationProbability)
                                    : 0
                                return (
                                <div key={i} className="flex items-center justify-between group">
                                    <span className="w-12 font-medium text-white/90">{label}</span>

                                    <div className="flex items-center gap-3 flex-1 px-4 justify-center">
                                        <div className="flex flex-col items-center gap-1">
                                            <DayIcon className="w-6 h-6 text-white/90 group-hover:scale-110 transition-transform" />
                                            {rain > 0 && (
                                                <span className="text-[10px] font-bold text-blue-300">{rain}%</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 w-32 justify-end">
                                        <span className="text-white/40 text-sm font-medium">{formatTemp(low)}</span>
                                        <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden relative">
                                            <div
                                                className="absolute h-full rounded-full"
                                                style={{
                                                    left: '20%',
                                                    right: '20%',
                                                    background: themeColor
                                                }}
                                            />
                                        </div>
                                        <span className="font-bold text-white">{formatTemp(high)}</span>
                                    </div>
                                </div>
                            )})}
                        </div>
                    </div>
                </motion.div>

                {/* Insights Grid - Styled cards with colored icon backgrounds */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="grid grid-cols-2 gap-4"
                >
                    <div className="bg-white/5 backdrop-blur-xl rounded-[24px] p-5 border border-white/5 hover:bg-white/10 transition-colors">
                        <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                            style={{ background: `${themeColor}30` }}
                        >
                            <Wind className="w-6 h-6 text-white" />
                        </div>
                        <div className="text-xs font-bold uppercase text-white/50 mb-2">
                          {t("weather.wind_speed", { defaultValue: "Wind speed" })}
                        </div>
                        <div className="text-3xl font-bold mb-1">
                          {typeof current?.windSpeed === "number" ? Math.round(current.windSpeed) : "—"}{" "}
                          <span className="text-lg text-white/50">km/h</span>
                        </div>
                    </div>

                    <div className="bg-white/5 backdrop-blur-xl rounded-[24px] p-5 border border-white/5 hover:bg-white/10 transition-colors">
                        <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                            style={{ background: `${themeColor}30` }}
                        >
                            <Droplets className="w-6 h-6 text-white" />
                        </div>
                        <div className="text-xs font-bold uppercase text-white/50 mb-2">
                          {t("weather.humidity", { defaultValue: "Humidity" })}
                        </div>
                        <div className="text-3xl font-bold mb-1">
                          {typeof current?.humidity === "number" ? Math.round(current.humidity) : "—"}
                          <span className="text-lg text-white/50">%</span>
                        </div>
                    </div>

                    <div className="bg-white/5 backdrop-blur-xl rounded-[24px] p-5 border border-white/5 hover:bg-white/10 transition-colors">
                        <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                            style={{ background: `${themeColor}30` }}
                        >
                            <Cloud className="w-6 h-6 text-white" />
                        </div>
                        <div className="text-xs font-bold uppercase text-white/50 mb-2">
                          {t("weather.cloud_cover", { defaultValue: "Cloud cover" })}
                        </div>
                        <div className="text-3xl font-bold mb-1">
                          {typeof current?.cloudCover === "number" ? Math.round(current.cloudCover) : "—"}
                          <span className="text-lg text-white/50">%</span>
                        </div>
                    </div>

                    <div className="bg-white/5 backdrop-blur-xl rounded-[24px] p-5 border border-white/5 hover:bg-white/10 transition-colors">
                        <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                            style={{ background: `${themeColor}30` }}
                        >
                            <Sun className="w-6 h-6 text-white" />
                        </div>
                        <div className="text-xs font-bold uppercase text-white/50 mb-2">
                          {t("weather.uv_index", { defaultValue: "UV index" })}
                        </div>
                        <div className="text-3xl font-bold mb-1">
                          {typeof current?.uvIndex === "number" ? Math.round(current.uvIndex) : "—"}
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    )
}
