"use client"

import { useState } from "react"
import { useTranslation } from "react-i18next"
import { motion } from "framer-motion"
import { X, Search, Plane, Hotel, Car, MapPin, Utensils, Palette, Music, ShoppingBag, ChevronRight, Train } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"

interface ActivitySelectorProps {
  tripId: string
  shareCode: string
  onBack: () => void
}

const categories = [
  { icon: Plane, label: "Flights", color: "#FF6B6B" },
  { icon: Hotel, label: "Lodging", color: "#4ECDC4" },
  { icon: MapPin, label: "Routes", color: "#95E1D3" },
  { icon: Car, label: "Car Rental", color: "#FFA07A" },
  { icon: Utensils, label: "Dining", color: "#FFD93D" },
  { icon: ShoppingBag, label: "Shopping", color: "#A8E6CF" },
]

const activities = [
  {
    section: "Food & Drink",
    items: [
      { icon: Utensils, label: "Restaurant", color: "#FFD93D" },
      { icon: Utensils, label: "Café", color: "#FFD93D" },
      { icon: Utensils, label: "Bar", color: "#FFD93D" },
    ],
  },
  {
    section: "Art & Fun",
    items: [
      { icon: Palette, label: "Museum", color: "#FF6B6B" },
      { icon: Music, label: "Concert", color: "#FF6B6B" },
      { icon: Palette, label: "Gallery", color: "#FF6B6B" },
    ],
  },
  {
    section: "Transportation",
    items: [
      { icon: Plane, label: "Flight", color: "#4ECDC4" },
      { icon: Train, label: "Train", color: "#4ECDC4" },
      { icon: Car, label: "Car Rental", color: "#FFA07A" },
      { icon: MapPin, label: "Route", color: "#95E1D3" },
    ],
  },
]

export default function ActivitySelector({ tripId, shareCode, onBack }: ActivitySelectorProps) {
  const { t } = useTranslation()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")

  const handleActivityClick = (activityLabel: string) => {
    // Map activity labels to core activity types
    const activityTypes: Record<string, string> = {
      "Flight": "flight",
      "Lodging": "accommodation",
      "Route": "custom",
      "Train": "train",
      "Car Rental": "car_rental",
      "Restaurant": "restaurant",
      "Café": "restaurant",
      "Bar": "restaurant",
      "Museum": "museum",
      "Concert": "concert",
      "Gallery": "attraction",
      "Shopping": "shopping",
    }

    const type = activityTypes[activityLabel] || "custom"
    router.push(`/trips/${shareCode}/activity/new?type=${type}`)
  }

  const handleCategoryClick = (categoryLabel: string) => {
    const categoryTypes: Record<string, string> = {
      "Flights": "flight",
      "Lodging": "accommodation",
      "Routes": "custom",
      "Car Rental": "car_rental",
      "Dining": "restaurant",
      "Shopping": "shopping",
    }

    const type = categoryTypes[categoryLabel] || "custom"
    router.push(`/trips/${shareCode}/activity/new?type=${type}`)
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg)" }}>
      <motion.div
        className="sticky top-0 z-10 border-b border-white/[0.08] px-6 py-4"
        style={{ backgroundColor: "var(--surface)" }}
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, type: "spring", stiffness: 100 }}
      >
        <div className="flex items-center justify-between mb-4">
          <motion.button
            onClick={onBack}
            className="text-sm font-medium"
            style={{ color: "var(--accent)" }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {t("activity.cancel")}
          </motion.button>
          <h1 className="text-lg font-semibold text-white">{t("activity.new_activity")}</h1>
          <motion.button
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "var(--surface-alt)" }}
            whileHover={{ scale: 1.05, backgroundColor: "rgba(255, 107, 107, 0.1)" }}
            whileTap={{ scale: 0.95 }}
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </motion.button>
        </div>

        <motion.div
          className="relative"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: "var(--accent)" }} />
          <Input
            type="text"
            placeholder={t("activity.search_placeholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-full text-white focus:ring-2 transition-all duration-200"
            style={
              {
                backgroundColor: "var(--surface-alt)",
                borderColor: "var(--border)",
                "--tw-ring-color": "rgba(255, 107, 107, 0.4)",
              } as any
            }
          />
        </motion.div>
      </motion.div>

      <motion.div
        className="px-6 py-6 overflow-x-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex gap-3 pb-2">
          {categories.map((category, index) => (
            <motion.button
              key={category.label}
              onClick={() => handleCategoryClick(category.label)}
              className="flex-shrink-0 flex flex-col items-center gap-2 group"
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                delay: 0.1 * index,
                type: "spring",
                stiffness: 150,
                damping: 12,
              }}
              whileHover={{ y: -4, scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div
                className="w-16 h-16 rounded-full flex items-center justify-center transition-all duration-150"
                style={{
                  backgroundColor: `${category.color}20`,
                  border: `1px solid ${category.color}40`,
                }}
                whileHover={{
                  backgroundColor: `${category.color}30`,
                  borderColor: category.color,
                  boxShadow: `0 0 20px ${category.color}40`,
                }}
              >
                <category.icon className="w-7 h-7" style={{ color: category.color }} />
              </motion.div>
              <span className="text-xs group-hover:text-white transition-colors text-muted-foreground">
                {category.label}
              </span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      <div className="px-6 pb-12">
        {activities.map((section, sectionIndex) => (
          <motion.div
            key={section.section}
            className="mb-8"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.3 + sectionIndex * 0.1,
              type: "spring",
              stiffness: 100,
            }}
          >
            <h2 className="text-sm font-semibold uppercase tracking-wide mb-4 text-muted-foreground">
              {section.section}
            </h2>
            <motion.div
              className="rounded-2xl overflow-hidden border border-white/[0.08] shadow-card"
              style={{ backgroundColor: "var(--surface)" }}
              whileHover={{ boxShadow: "0 10px 40px rgba(0, 0, 0, 0.3)" }}
            >
              {section.items.map((item, itemIndex) => (
                <div key={item.label}>
                  <motion.button
                    className="w-full flex items-center gap-4 px-5 py-4 transition-colors group"
                    style={{
                      backgroundColor: "transparent",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--surface-alt)")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    onClick={() => handleActivityClick(item.label)}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <motion.div
                      className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{
                        backgroundColor: `${item.color}20`,
                        border: `1px solid ${item.color}40`,
                      }}
                      whileHover={{
                        scale: 1.1,
                        backgroundColor: `${item.color}30`,
                      }}
                    >
                      <item.icon className="w-5 h-5" style={{ color: item.color }} />
                    </motion.div>
                    <span className="text-white text-base flex-1 text-left">{item.label}</span>
                    <ChevronRight
                      className="w-5 h-5 transition-colors group-hover:translate-x-1"
                      style={{ color: "var(--accent)" }}
                    />
                  </motion.button>
                  {itemIndex < section.items.length - 1 && <div className="h-px bg-white/10 mx-5" />}
                </div>
              ))}
            </motion.div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

