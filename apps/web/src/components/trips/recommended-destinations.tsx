"use client"

import { motion } from "framer-motion"
import { Star, MapPin } from "lucide-react"
import { Card } from "@/components/ui/card"
import { useTranslation } from "react-i18next"

const recommendedDestinations = [
  {
    id: "1",
    name: "Blue Lagoon",
    location: "Europe, Iceland",
    image: "/blue-lagoon-iceland-geothermal-spa.jpg",
    isFavorite: true,
  },
  {
    id: "2",
    name: "Maldive Islands",
    location: "Indian Ocean",
    image: "/maldives-tropical-beach-resort.jpg",
    isFavorite: true,
  },
  {
    id: "3",
    name: "Mountain Peak",
    location: "United States",
    image: "/mountain-peak-forest-sunrise.jpg",
    isFavorite: true,
  },
  {
    id: "4",
    name: "Santorini",
    location: "Greece",
    image: "/santorini-white-buildings-sunset.jpg",
    isFavorite: false,
  },
]

export default function RecommendedDestinations() {
  const { t } = useTranslation()
  
  return (
    <motion.div
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, type: "spring", damping: 20 }}
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">{t('recommended.title')}</h2>
        <motion.button
          className="text-[#ff6b6b] font-semibold text-sm hover:text-[#ff8585] transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          View All
        </motion.button>
      </div>

      <div className="flex gap-4 pb-4 -mx-4 px-4 overflow-x-auto scrollbar-hide">
        {recommendedDestinations.map((destination, index) => (
          <motion.div
            key={destination.id}
            className="flex-shrink-0 w-[280px] group cursor-pointer"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 + index * 0.03, type: "spring", stiffness: 600, damping: 20 }}
            whileHover={{ y: -8 }}
            style={{ transition: "transform 0.1s cubic-bezier(0.34, 1.56, 0.64, 1)" }}
          >
            <Card className="border-white/[0.08] rounded-2xl shadow-lg bg-[var(--surface)] backdrop-blur-xl hover:border-white/[0.15] hover:shadow-2xl hover:shadow-[#ff6b6b]/10 transition-all duration-200">
              <div className="relative h-[200px] rounded-2xl overflow-hidden">
                <motion.img
                  src={destination.image}
                  alt={destination.name}
                  className="w-full h-full object-cover"
                  whileHover={{ scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 800, damping: 20 }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                <motion.div
                  className="absolute top-3 left-3 w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: "rgba(255, 255, 255, 0.2)" }}
                  whileHover={{ scale: 1.1, background: "rgba(255, 107, 107, 0.3)" }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 800, damping: 15 }}
                >
                  <Star
                    className="w-4 h-4"
                    fill={destination.isFavorite ? "#ff6b6b" : "none"}
                    stroke={destination.isFavorite ? "#ff6b6b" : "white"}
                  />
                </motion.div>

                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="text-lg font-bold text-white mb-1 group-hover:text-[#ff6b6b] transition-colors duration-150">
                    {destination.name}
                  </h3>
                  <div className="flex items-center gap-1 text-white/70 text-xs">
                    <MapPin className="w-3 h-3" />
                    <span>{destination.location}</span>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
