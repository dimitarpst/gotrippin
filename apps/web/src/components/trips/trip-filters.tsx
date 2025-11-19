"use client"

import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { useTranslation } from "react-i18next"

interface TripFiltersProps {
  activeFilter: "all" | "upcoming" | "past"
  onFilterChange: (filter: "all" | "upcoming" | "past") => void
  searchQuery: string
  onSearchChange: (query: string) => void
  tripsCount: number
}

export default function TripFilters({
  activeFilter,
  onFilterChange,
  searchQuery,
  onSearchChange,
  tripsCount
}: TripFiltersProps) {
  const { t } = useTranslation()

  const filterLabels = {
    all: t('trips.all'),
    upcoming: t('trips.upcoming'),
    past: t('trips.past')
  }

  return (
    <motion.div
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, type: "spring", damping: 20 }}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          {(["all", "upcoming", "past"] as const).map((filter) => (
            <motion.button
              key={filter}
              onClick={() => onFilterChange(filter)}
              className="px-5 py-2.5 rounded-xl font-medium text-sm transition-all relative overflow-hidden"
              style={{
                background: activeFilter === filter ? "#ff6b6b" : "rgba(255, 255, 255, 0.08)",
                color: activeFilter === filter ? "white" : "var(--muted)",
              }}
              whileHover={{
                scale: 1.05,
                background: activeFilter === filter ? "#ff6b6b" : "rgba(255, 255, 255, 0.12)",
              }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              {activeFilter === filter && (
                <motion.div
                  layoutId="activeFilter"
                  className="absolute inset-0 rounded-xl"
                  style={{ background: "#ff6b6b" }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                {filterLabels[filter]}
                {filter === "all" && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 15 }}
                  >
                    <Badge
                      className="text-xs border-0 px-2 py-0.5"
                      style={{
                        background: activeFilter === filter ? "rgba(255, 255, 255, 0.2)" : "#ff6b6b",
                        color: "white",
                      }}
                    >
                      {tripsCount}
                    </Badge>
                  </motion.span>
                )}
              </span>
            </motion.button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder={t('trips.search_placeholder', 'Search trips...')}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-muted-foreground focus-visible:ring-[#ff6b6b]"
          />
        </div>
      </div>
    </motion.div>
  )
}
