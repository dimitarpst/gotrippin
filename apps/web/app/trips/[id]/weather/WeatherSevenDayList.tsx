"use client"

import { motion } from "framer-motion"
import type { WeatherData } from "@gotrippin/core"
import { getWeatherIcon, formatTemp, formatDayLabel } from "./weather-utils"
import { useTranslation } from "react-i18next"

export interface WeatherSevenDayListProps {
  forecast: NonNullable<WeatherData["forecast"]>
  themeHex: string
}

export default function WeatherSevenDayList({ forecast, themeHex }: WeatherSevenDayListProps) {
  const { t } = useTranslation()
  const days = forecast.slice(0, 7).length ? forecast.slice(0, 7) : new Array(7).fill(null)

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-8">
      <div className="bg-white/5 backdrop-blur-xl rounded-[32px] p-6 border border-white/5">
        <h3 className="text-sm font-bold text-white/50 mb-6 uppercase tracking-wider ml-1">
          {t("weather.seven_day", { defaultValue: "7-Day Forecast" })}
        </h3>
        <div className="space-y-6">
          {days.map((day, i) => {
            const DayIcon = getWeatherIcon(day?.weatherCode)
            const label = day?.date ? formatDayLabel(day.date, i) : "—"
            const low = day?.temperatureMin ?? day?.temperature
            const high = day?.temperatureMax ?? day?.temperature
            const rain =
              typeof day?.precipitationProbability === "number" ? Math.round(day.precipitationProbability) : 0
            return (
              <div key={i} className="flex items-center justify-between group">
                <span className="w-12 font-medium text-white/90">{label}</span>
                <div className="flex items-center gap-3 flex-1 px-4 justify-center">
                  <div className="flex flex-col items-center gap-1">
                    <DayIcon className="w-6 h-6 text-white/90 group-hover:scale-110 transition-transform" />
                    {rain > 0 && <span className="text-[10px] font-bold text-blue-300">{rain}%</span>}
                  </div>
                </div>
                <div className="flex items-center gap-4 w-32 justify-end">
                  <span className="text-white/40 text-sm font-medium">{formatTemp(low)}</span>
                  <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden relative">
                    <div
                      className="absolute h-full rounded-full"
                      style={{ left: "20%", right: "20%", background: themeHex }}
                    />
                  </div>
                  <span className="font-bold text-white">{formatTemp(high)}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </motion.div>
  )
}
