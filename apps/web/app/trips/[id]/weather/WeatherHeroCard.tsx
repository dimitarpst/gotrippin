"use client"

import { motion } from "framer-motion"
import { Wind, Droplets, Sun } from "lucide-react"
import { Card } from "@/components/ui/card"
import type { TripLocationWeather } from "@gotrippin/core"
import { getWeatherIcon, formatTemp } from "./weather-utils"
import { useTranslation } from "react-i18next"

export interface WeatherHeroCardProps {
  locationWeather: TripLocationWeather["weather"] | null
  themeHex: string
  loading: boolean
}

export default function WeatherHeroCard({ locationWeather, themeHex, loading }: WeatherHeroCardProps) {
  const { t } = useTranslation()
  const current = locationWeather?.current
  const forecast = locationWeather?.forecast || []
  const WeatherIcon = getWeatherIcon(current?.weatherCode)

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
      <Card
        className="border-0 overflow-hidden relative rounded-[32px] shadow-2xl p-8"
        style={{ background: `linear-gradient(135deg, ${themeHex} 0%, ${themeHex}aa 100%)` }}
      >
        <div className="absolute top-0 left-0 right-0 h-1/2 bg-linear-to-b from-white/10 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col items-center justify-center text-center">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="relative mb-6"
          >
            <div
              className="w-32 h-32 rounded-3xl flex items-center justify-center backdrop-blur-sm border border-white/10"
              style={{ background: `${themeHex}40` }}
            >
              <WeatherIcon className="w-20 h-20 text-white drop-shadow-lg" />
            </div>
          </motion.div>
          <h2 className="text-8xl font-bold tracking-tighter mb-3 drop-shadow-sm">
            {formatTemp(current?.temperature)}
          </h2>
          <p className="text-xl font-medium opacity-90 mb-6">
            {current?.description ||
              (loading
                ? t("trip_overview.weather_loading", { defaultValue: "Loading weather..." })
                : t("weather.no_data", { defaultValue: "No data" }))}
          </p>
          <div className="grid grid-cols-3 gap-3 w-full max-w-sm">
            <div className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-black/10 backdrop-blur-sm border border-white/10">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${themeHex}40` }}>
                <Wind className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs text-white/60 font-medium">{t("weather.wind", { defaultValue: "Wind" })}</span>
              <span className="text-sm font-bold">
                {typeof current?.windSpeed === "number" ? `${Math.round(current.windSpeed)} km/h` : "—"}
              </span>
            </div>
            <div className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-black/10 backdrop-blur-sm border border-white/10">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${themeHex}40` }}>
                <Droplets className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs text-white/60 font-medium">{t("weather.humidity", { defaultValue: "Humidity" })}</span>
              <span className="text-sm font-bold">
                {typeof current?.humidity === "number" ? `${Math.round(current.humidity)}%` : "—"}
              </span>
            </div>
            <div className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-black/10 backdrop-blur-sm border border-white/10">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${themeHex}40` }}>
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
  )
}
