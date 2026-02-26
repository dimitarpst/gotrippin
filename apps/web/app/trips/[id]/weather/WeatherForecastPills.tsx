"use client"

import { motion } from "framer-motion"
import type { WeatherData } from "@gotrippin/core"
import { getWeatherIcon, formatTemp, formatDayLabel } from "./weather-utils"

export interface WeatherForecastPillsProps {
  forecast: NonNullable<WeatherData["forecast"]>
}

export default function WeatherForecastPills({ forecast }: WeatherForecastPillsProps) {
  const days = forecast.slice(0, 6).length ? forecast.slice(0, 6) : new Array(6).fill(null)

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-8">
      <div className="flex justify-between overflow-x-auto pb-4 scrollbar-hide gap-3 px-1">
        {days.map((day, i) => {
          const DayIcon = getWeatherIcon(day?.weatherCode)
          const active = i === 0
          const label = day?.date ? formatDayLabel(day.date, i) : "—"
          const temp = day?.temperature ?? day?.temperatureMax ?? day?.temperatureMin
          const chance =
            typeof day?.precipitationProbability === "number" ? Math.round(day.precipitationProbability) : null
          return (
            <div
              key={i}
              className={`flex flex-col items-center gap-3 min-w-[64px] py-4 rounded-[20px] border backdrop-blur-md transition-all ${
                active ? "bg-white/20 border-white/20 shadow-lg scale-105" : "bg-white/5 border-white/5 hover:bg-white/10"
              }`}
            >
              <span className="text-xs font-medium text-white/70">{label}</span>
              <DayIcon className={`w-6 h-6 ${active ? "text-white" : "text-white/80"}`} />
              <span className="text-lg font-bold">{formatTemp(temp)}</span>
              {chance !== null && chance > 0 && <span className="text-[10px] font-bold text-blue-200">{chance}%</span>}
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}
