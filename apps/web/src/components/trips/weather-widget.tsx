"use client"

import { motion } from "framer-motion"
import { Cloud, Sun, CloudRain, CloudSnow, Wind, Droplets, MapPin } from "lucide-react"
import { Card } from "@/components/ui/card"
import type { WeatherData } from "@gotrippin/core"
import { useTranslation } from "react-i18next"

interface WeatherWidgetProps {
  weather: WeatherData
  compact?: boolean
  onClick?: () => void
  color?: string
  variant?: "full" | "inline" | "compact"
  updatedAt?: number | null
  showMeta?: boolean
  minimal?: boolean
}

/**
 * Get weather icon based on weather code
 */
function getWeatherIcon(code: number) {
  // Clear/Sunny
  if (code === 1000 || code === 1100) return Sun
  // Partly/Mostly Cloudy
  if (code === 1101 || code === 1102) return Cloud
  // Cloudy
  if (code === 1001) return Cloud
  // Rain
  if (code >= 4000 && code <= 4201) return CloudRain
  // Snow
  if (code >= 5000 && code <= 5101) return CloudSnow
  // Default
  return Cloud
}

/**
 * Format temperature for display
 */
function formatTemp(temp: number): string {
  return `${Math.round(temp)}°`
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

/**
 * Weather Widget Component
 * Displays current weather and forecast with Aurora theme styling
 */
export default function WeatherWidget({
  weather,
  compact = false,
  onClick,
  color = "#1a1a2e",
  variant,
  updatedAt,
  showMeta = false,
  minimal = false,
}: WeatherWidgetProps) {
  const { t } = useTranslation()
  const activeVariant = variant || (compact ? "compact" : "full")
  const WeatherIcon = weather.current ? getWeatherIcon(weather.current.weatherCode) : Sun
  const updatedLabel = showMeta ? getUpdatedLabel(t, updatedAt) : null
  const precipChance =
    typeof weather.forecast?.[0]?.precipitationProbability === "number"
      ? Math.round(weather.forecast[0]!.precipitationProbability)
      : null

  if (activeVariant === "inline") {
    const temperature = weather.current?.temperature
    const description = weather.current?.description
    const locationLabel = weather.location

    return (
      <motion.div
        className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-card-foreground shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-white/5 dark:text-white/80 dark:shadow-[0_8px_30px_rgba(0,0,0,0.25)]"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
      >
        <WeatherIcon className="w-4 h-4 text-foreground dark:text-white" />
        <div className="flex items-center gap-1.5">
          {typeof temperature === "number" && (
            <span className="text-sm font-semibold text-foreground dark:text-white">
              {formatTemp(temperature)}
            </span>
          )}
          {!minimal && description && (
            <span className="text-xs text-muted-foreground dark:text-white/80">{description}</span>
          )}
        </div>
        {!minimal && locationLabel && (
          <span className="text-[11px] uppercase tracking-wide text-muted-foreground whitespace-nowrap ml-1 dark:text-white/60">
            {locationLabel}
          </span>
        )}
        {!minimal && updatedLabel && (
          <span className="text-[11px] text-muted-foreground whitespace-nowrap dark:text-white/50">
            {updatedLabel}
          </span>
        )}
      </motion.div>
    )
  }

  if (activeVariant === "compact") {
    // Compact version for trip cards
    if (!weather.current) {
      return null
    }

    return (
      <motion.div
        className="absolute top-3 left-3 flex items-center gap-2 px-2.5 py-1.5 rounded-lg backdrop-blur-md border border-white/20"
        style={{ background: "rgba(0,0,0,0.4)" }}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 20 }}
      >
        <WeatherIcon className="w-4 h-4 text-white" />
        <span className="text-white text-xs font-semibold">
          {formatTemp(weather.current.temperature)}
        </span>
      </motion.div>
    )
  }

  // Full widget version for trip overview (Summary Card)
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="w-full cursor-pointer"
      onClick={onClick}
    >
       <Card
         className="relative overflow-hidden border-0 rounded-3xl shadow-xl"
         style={{
           background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`,
         }}
       >
         {/* Glass shine effect */}
         <div className="absolute top-0 left-0 right-0 h-1/2 bg-linear-to-b from-white/10 to-transparent pointer-events-none" />

        {weather.current && (
          <div className="relative p-5 sm:p-6 flex flex-row items-start justify-between z-10 gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-white/90 text-sm font-medium mb-2">
                <MapPin className="w-4 h-4 shrink-0" />
                <span className="truncate">{weather.location}</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-5xl sm:text-6xl font-bold text-white tracking-tighter drop-shadow-sm">
                  {formatTemp(weather.current.temperature)}
                </span>
              </div>
              <div className="text-white font-medium mt-1 text-base sm:text-lg">
                {weather.current.description}
              </div>
              <div className="text-white/70 text-xs sm:text-sm mt-0.5">
                {t("weather.feels_like", {
                  defaultValue: "Feels like {{temp}}",
                  temp: formatTemp(weather.current.temperatureApparent),
                })}
              </div>
              {updatedLabel && (
                <div className="text-[11px] text-white/50 mt-2">
                  {updatedLabel}
                </div>
              )}
            </div>

            <div className="flex flex-col items-end gap-6 shrink-0 pt-2">
              <motion.div
                initial={{ rotate: -10, scale: 0.9 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 260,
                  damping: 20,
                  repeat: Infinity,
                  repeatType: "reverse",
                  duration: 2
                }}
              >
                <WeatherIcon className="w-16 h-16 sm:w-24 sm:h-24 text-white drop-shadow-lg" />
              </motion.div>

              <div className="flex flex-col gap-2 bg-white/5 border border-white/10 rounded-2xl p-3 pr-4 shadow-sm">
                <div className="flex items-center gap-2.5">
                  <Wind className="w-3.5 h-3.5 text-white/70" />
                  <span className="text-xs text-white font-medium">{Math.round(weather.current.windSpeed)} km/h</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Droplets className="w-3.5 h-3.5 text-white/70" />
                  <span className="text-xs text-white font-medium">{weather.current.humidity}%</span>
                </div>
                {typeof precipChance === "number" && (
                  <div className="flex items-center gap-2.5">
                    <CloudRain className="w-3.5 h-3.5 text-white/70" />
                    <span className="text-xs text-white font-medium">{precipChance}%</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Card>
    </motion.div>
  )
}
