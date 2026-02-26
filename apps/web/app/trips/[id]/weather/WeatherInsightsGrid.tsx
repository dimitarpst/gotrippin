"use client"

import { motion } from "framer-motion"
import { Wind, Droplets, Cloud, Sun } from "lucide-react"
import type { WeatherData } from "@gotrippin/core"
import { useTranslation } from "react-i18next"

export interface WeatherInsightsGridProps {
  current: NonNullable<WeatherData["current"]> | null
  themeHex: string
}

export default function WeatherInsightsGrid({ current, themeHex }: WeatherInsightsGridProps) {
  const { t } = useTranslation()

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="grid grid-cols-2 gap-4">
      <div className="bg-white/5 backdrop-blur-xl rounded-[24px] p-5 border border-white/5 hover:bg-white/10 transition-colors">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: `${themeHex}30` }}>
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
        <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: `${themeHex}30` }}>
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
        <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: `${themeHex}30` }}>
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
        <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: `${themeHex}30` }}>
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
  )
}
