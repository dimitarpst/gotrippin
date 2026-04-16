"use client"

import { motion } from "framer-motion"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"

interface TripFiltersProps {
  activeFilter: "all" | "upcoming" | "past"
  onFilterChange: (filter: "all" | "upcoming" | "past") => void
  searchQuery: string
  onSearchChange: (query: string) => void
  /** Total trips in the current list scope (before time filter). */
  tripsCount: number
  /** When search is shown in the floating header, hide the duplicate field here. */
  hideSearch?: boolean
}

export default function TripFilters({
  activeFilter,
  onFilterChange,
  searchQuery,
  onSearchChange,
  tripsCount,
  hideSearch = false,
}: TripFiltersProps) {
  const { t } = useTranslation()

  const filterLabels = {
    all: t("trips.all"),
    upcoming: t("trips.upcoming"),
    past: t("trips.past"),
  }

  return (
    <motion.div
      className="mx-auto max-w-7xl px-4 pb-2 pt-3 sm:px-6 sm:pt-2 lg:px-8"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, type: "spring", damping: 22 }}
    >
      <div
        className={cn(
          "mb-4 flex flex-col gap-3",
          hideSearch ? "items-stretch" : "sm:flex-row sm:items-center sm:justify-between"
        )}
      >
        <div
          className="inline-flex w-full max-w-full rounded-full bg-muted/50 p-1 dark:bg-white/[0.06] sm:w-auto"
          role="tablist"
          aria-label={t("trips.time_filter_label", { defaultValue: "Filter by time" })}
        >
          {(["all", "upcoming", "past"] as const).map((filter) => (
            <button
              key={filter}
              type="button"
              role="tab"
              aria-selected={activeFilter === filter}
              onClick={() => onFilterChange(filter)}
              className={cn(
                "relative flex min-h-9 flex-1 items-center justify-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-colors sm:flex-none sm:px-4",
                activeFilter === filter
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {activeFilter === filter ? (
                <motion.span
                  layoutId="tripListTimeFilter"
                  className="absolute inset-0 rounded-full bg-background shadow-sm dark:bg-white/[0.1]"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              ) : null}
              <span className="relative z-10 flex items-center gap-2">
                {filterLabels[filter]}
                {filter === "all" ? (
                  <span
                    className={cn(
                      "tabular-nums text-[11px] font-medium",
                      activeFilter === "all"
                        ? "text-muted-foreground"
                        : "text-muted-foreground/80"
                    )}
                  >
                    ({tripsCount})
                  </span>
                ) : null}
              </span>
            </button>
          ))}
        </div>

        {!hideSearch ? (
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder={t("trips.search_placeholder", "Search trips...")}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="h-10 rounded-full border-border/50 bg-muted/30 pl-9 dark:border-white/10 dark:bg-white/[0.04]"
            />
          </div>
        ) : null}
      </div>
    </motion.div>
  )
}
