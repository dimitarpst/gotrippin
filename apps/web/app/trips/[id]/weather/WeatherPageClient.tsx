"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { getTripWeather } from "@/lib/api/weather"
import { useAuth } from "@/contexts/AuthContext"
import type { Trip, TripWeatherResponse, TripLocationWeather } from "@gotrippin/core"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import WeatherPageChrome from "./WeatherPageChrome"
import WeatherHeroCard from "./WeatherHeroCard"
import WeatherForecastPills from "./WeatherForecastPills"
import WeatherSevenDayList from "./WeatherSevenDayList"
import WeatherInsightsGrid from "./WeatherInsightsGrid"

export interface WeatherPageClientProps {
  trip: Trip
  shareCode: string
  initialWeather: TripWeatherResponse | null
  /** Resolved R2 URL for trip cover (server-computed so client does not import r2) */
  coverImageUrl?: string | null
}

export default function WeatherPageClient({ trip, shareCode, initialWeather, coverImageUrl }: WeatherPageClientProps) {
  const { t } = useTranslation()
  const { accessToken } = useAuth()

  const [weather, setWeather] = useState<TripWeatherResponse | null>(initialWeather)
  const [fetchedAt, setFetchedAt] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dominantColor, setDominantColor] = useState<string | null>(null)
  const [activeLocationId, setActiveLocationId] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getTripWeather(trip.id, 7, accessToken)
      setWeather(data)
      setFetchedAt(Date.now())
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to fetch weather"
      setError(msg)
      toast.error(t("weather.unavailable", { defaultValue: "Weather unavailable" }), { description: msg })
    } finally {
      setLoading(false)
    }
  }, [trip.id, accessToken, t])

  useEffect(() => {
    if (activeLocationId) return
    if (!weather?.locations?.length) return
    const preferred = weather.locations.find((l) => l.weather)?.locationId
    setActiveLocationId(preferred ?? weather.locations[0].locationId)
  }, [weather, activeLocationId])

  useEffect(() => {
    if (!coverImageUrl) {
      setDominantColor(null)
      return
    }
    const img = new Image()
    img.crossOrigin = "Anonymous"
    img.src = coverImageUrl
    img.onload = () => {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      if (!ctx) return
      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)
      try {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const data = imageData.data
        let r = 0, g = 0, b = 0
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
        setDominantColor(`#${[r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("")}`)
      } catch {
        setDominantColor(null)
      }
    }
    img.onerror = () => setDominantColor(null)
  }, [coverImageUrl])

  const hasCoverImage = !!coverImageUrl
  const isGradient = trip?.color ? trip.color.startsWith("linear-gradient") : false
  const themeColor = hasCoverImage
    ? dominantColor
    : trip?.color && !isGradient
      ? trip.color
      : null
  const themeHex = themeColor ?? "#1a1a2e"

  const selectedLocation: TripLocationWeather | null = useMemo(() => {
    if (!weather?.locations?.length) return null
    return (
      weather.locations.find((l) => l.locationId === activeLocationId) ??
      weather.locations[0] ??
      null
    )
  }, [weather, activeLocationId])

  const locationWeather = selectedLocation?.weather || null

  return (
    <div className="min-h-screen bg-[#0e0b10] text-white relative overflow-hidden">
      {themeColor && (
        <>
          <div
            className="fixed top-[-20%] left-[-20%] w-[80%] h-[80%] rounded-full blur-[120px] opacity-30 pointer-events-none"
            style={{ background: themeColor }}
          />
          <div
            className="fixed bottom-[-20%] right-[-20%] w-[80%] h-[80%] rounded-full blur-[120px] opacity-20 pointer-events-none"
            style={{ background: themeColor }}
          />
        </>
      )}

      <div className="relative z-10 p-4 pb-20 max-w-lg mx-auto">
        <WeatherPageChrome
          trip={trip}
          shareCode={shareCode}
          weather={weather}
          selectedLocation={selectedLocation}
          activeLocationId={activeLocationId}
          error={error}
          initialWeather={initialWeather}
          fetchedAt={fetchedAt}
          loading={loading}
          onRetry={refetch}
          onSelectLocation={setActiveLocationId}
        />

        <WeatherHeroCard
          locationWeather={locationWeather}
          themeHex={themeHex}
          loading={loading}
        />

        <WeatherForecastPills forecast={locationWeather?.forecast || []} />

        <WeatherSevenDayList
          forecast={locationWeather?.forecast || []}
          themeHex={themeHex}
        />

        <WeatherInsightsGrid
          current={locationWeather?.current || null}
          themeHex={themeHex}
        />
      </div>
    </div>
  )
}
