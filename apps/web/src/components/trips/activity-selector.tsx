"use client"

import { useState } from "react"
import { useTranslation } from "react-i18next"
import { motion } from "framer-motion"
import { X, Search, Plane, Hotel, Car, MapPin, Utensils, Palette, Music, ShoppingBag, ChevronRight, Train } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

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
      Flight: "flight",
      Lodging: "accommodation",
      Route: "custom",
      Train: "train",
      "Car Rental": "car_rental",
      Restaurant: "restaurant",
      Café: "restaurant",
      Bar: "restaurant",
      Museum: "museum",
      Concert: "concert",
      Gallery: "attraction",
      Shopping: "shopping",
    }

    const type = activityTypes[activityLabel] || "custom"
    router.push(`/trips/${shareCode}/activity/new?type=${type}`)
  }

  const handleCategoryClick = (categoryLabel: string) => {
    const categoryTypes: Record<string, string> = {
      Flights: "flight",
      Lodging: "accommodation",
      Routes: "custom",
      "Car Rental": "car_rental",
      Dining: "restaurant",
      Shopping: "shopping",
    }

    const type = categoryTypes[categoryLabel] || "custom"
    router.push(`/trips/${shareCode}/activity/new?type=${type}`)
  }

  return (
    <div className="min-h-screen bg-muted/50 text-foreground dark:bg-[var(--bg)]">
      <motion.div
        className="sticky top-0 z-10 border-b border-border bg-card/95 px-6 py-4 shadow-sm backdrop-blur-md dark:border-white/[0.08]"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, type: "spring", stiffness: 100 }}
      >
        <div className="flex items-center justify-between mb-4">
          <motion.button
            type="button"
            onClick={onBack}
            className="text-sm font-semibold text-primary hover:text-primary/90"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {t("activity.cancel")}
          </motion.button>
          <h1 className="text-lg font-semibold text-foreground dark:text-white">
            {t("activity.new_activity")}
          </h1>
          <motion.button
            type="button"
            onClick={onBack}
            aria-label={t("common.close")}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-muted hover:bg-muted/80 dark:hover:bg-white/10"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <X className="h-5 w-5 text-muted-foreground" aria-hidden />
          </motion.button>
        </div>

        <motion.div
          className="relative"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-primary" />
          <Input
            type="text"
            placeholder={t("activity.search_placeholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(
              "h-11 w-full rounded-full border-border bg-muted/80 py-3 pl-12 pr-4 text-foreground shadow-xs",
              "placeholder:text-muted-foreground",
              "focus-visible:border-primary/40 focus-visible:ring-primary/25",
            )}
          />
        </motion.div>
      </motion.div>

      <motion.div
        className="overflow-x-auto px-6 py-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex gap-3 pb-2">
          {categories.map((category, index) => (
            <motion.button
              key={category.label}
              type="button"
              onClick={() => handleCategoryClick(category.label)}
              className="flex flex-shrink-0 flex-col items-center gap-2 group"
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
                className="flex h-16 w-16 items-center justify-center rounded-full transition-all duration-150"
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
                <category.icon className="h-7 w-7" style={{ color: category.color }} />
              </motion.div>
              <span className="text-xs text-muted-foreground transition-colors group-hover:text-foreground dark:group-hover:text-white">
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
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {section.section}
            </h2>
            <motion.div
              className={cn(
                "overflow-hidden rounded-2xl border border-border bg-card shadow-md",
                "dark:border-white/[0.08] dark:shadow-[0_10px_40px_rgba(0,0,0,0.3)]",
              )}
              whileHover={{ boxShadow: "0 12px 40px -8px color-mix(in oklch, var(--foreground) 12%, transparent)" }}
            >
              {section.items.map((item, itemIndex) => (
                <div key={item.label}>
                  <motion.button
                    type="button"
                    className="group flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-muted/90 dark:hover:bg-white/[0.06]"
                    onClick={() => handleActivityClick(item.label)}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <motion.div
                      className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full"
                      style={{
                        backgroundColor: `${item.color}20`,
                        border: `1px solid ${item.color}40`,
                      }}
                      whileHover={{
                        scale: 1.1,
                        backgroundColor: `${item.color}30`,
                      }}
                    >
                      <item.icon className="h-5 w-5" style={{ color: item.color }} />
                    </motion.div>
                    <span className="flex-1 text-base font-medium text-foreground dark:text-white">
                      {item.label}
                    </span>
                    <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                  </motion.button>
                  {itemIndex < section.items.length - 1 && (
                    <div className="mx-5 h-px bg-border dark:bg-white/10" />
                  )}
                </div>
              ))}
            </motion.div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
