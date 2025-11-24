"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Calendar, MapPin } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import WeatherWidget from "./weather-widget"
import type { Trip } from "@gotrippin/core"
import type { WeatherData } from "@gotrippin/core"

interface TripWithCalculations extends Trip {
  startDate: string
  endDate: string
  daysUntil: number
  duration: number
}

interface TripGridProps {
  trips: TripWithCalculations[]
  activeFilter: "all" | "upcoming" | "past"
  onSelectTrip: (shareCode: string) => void
}

export default function TripGrid({ trips, activeFilter, onSelectTrip }: TripGridProps) {
  return (
    <motion.div
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, type: "spring", damping: 20 }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={activeFilter}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.2 }}
        >
          {trips.map((trip, index) => (
            <motion.div
              key={trip.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{
                type: "spring",
                stiffness: 350,
                damping: 25,
                delay: index * 0.05,
              }}
              layout
              whileHover={{ y: -8 }}
            >
              <Card
                className="border-white/[0.08] rounded-2xl overflow-hidden shadow-lg cursor-pointer transition-all duration-300 bg-[var(--surface)] backdrop-blur-xl group hover:border-white/[0.15] hover:shadow-2xl hover:shadow-[#ff6b6b]/10"
                onClick={() => onSelectTrip(trip.share_code)}
              >
                      <div className="relative h-48 overflow-hidden" style={{ background: trip.image_url ? 'transparent' : trip.color || '#ff6b6b' }}>
                        {trip.image_url ? (
                          <motion.img
                            src={trip.image_url}
                            alt={trip.destination || trip.title || "Trip"}
                            className="w-full h-full object-cover"
                            whileHover={{ scale: 1.1 }}
                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                            onError={(e) => {
                              // Fallback to color if image fails to load
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              target.parentElement!.style.background = trip.color || '#ff6b6b';
                            }}
                          />
                        ) : null}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-100 group-hover:from-black/90 transition-all duration-300" />

                  {/* Weather Badge - Always show for testing */}
                  <WeatherWidget
                    weather={{
                      location: trip.destination || "Tokyo",
                      current: {
                        temperature: 15 + Math.floor(Math.random() * 10),
                        temperatureApparent: 14,
                        humidity: 65,
                        weatherCode: 1000,
                        description: "Clear, Sunny",
                        windSpeed: 10,
                        windDirection: 180,
                        cloudCover: 20,
                      },
                    }}
                    compact
                  />

                  {trip.daysUntil > 0 && (
                    <motion.div
                      className="absolute top-3 right-3"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    >
                      <Badge
                        className="text-white border-0 text-xs font-semibold shadow-lg"
                        style={{ background: "#ff6b6b" }}
                      >
                        {trip.daysUntil} days
                      </Badge>
                    </motion.div>
                  )}

                  <motion.div
                    className="absolute bottom-0 left-0 right-0 p-4"
                    initial={{ y: 0 }}
                    whileHover={{ y: -4 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[#ff6b6b] transition-colors duration-200">
                      {trip.destination || trip.title || "Untitled Trip"}
                    </h3>
                    <div className="flex items-center gap-3 text-white/80 text-xs">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>
                          {trip.startDate} → {trip.endDate}
                        </span>
                      </div>
                      {trip.duration > 0 && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          <span>{trip.duration} days</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  )
}
