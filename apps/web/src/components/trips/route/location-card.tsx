"use client"

import { Calendar, X } from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { useState, type ReactNode } from "react"
import { DatePicker } from "../date-picker"
import { DateRange } from "react-day-picker"

interface LocationCardProps {
  index: number
  name: string
  arrivalDate?: string | null
  departureDate?: string | null
  onRemove?: () => void
  onUpdateDates?: (range: DateRange | undefined) => void
  onUpdateName?: (name: string) => void
  dragHandle?: ReactNode
  isOverlay?: boolean
}

export function LocationCard({
  index,
  name,
  arrivalDate,
  departureDate,
  onRemove,
  onUpdateDates,
  onUpdateName,
  dragHandle,
  isOverlay = false,
}: LocationCardProps) {
  const [showDatePicker, setShowDatePicker] = useState(false)

  const selectedRange: DateRange | undefined = arrivalDate
    ? {
        from: new Date(arrivalDate),
        to: departureDate ? new Date(departureDate) : undefined,
      }
    : undefined

  const dateText = selectedRange?.from
    ? `${format(selectedRange.from, "MMM d")}${
        selectedRange.to ? ` - ${format(selectedRange.to, "MMM d")}` : ""
      }`
    : "Set dates"

  const handleNameChange = (value: string) => {
    if (isOverlay || !onUpdateName) return
    onUpdateName(value)
  }

  const handleDateOpen = () => {
    if (isOverlay) return
    setShowDatePicker(true)
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={cn(
          "group relative mb-3 flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md transition-all duration-200 hover:border-white/20 hover:bg-white/10",
          isOverlay && "pointer-events-none opacity-90",
        )}
      >
        {dragHandle}

        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-white/5 bg-white/5 text-xs font-medium text-white/60">
          {index + 1}
        </div>

        <div className="min-w-0 flex-1">
          <input
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Enter location name"
            className="w-full border-none bg-transparent p-0 text-lg font-semibold text-white outline-none placeholder:text-white/20"
            readOnly={isOverlay}
          />

          <button
            type="button"
            onClick={handleDateOpen}
            className="mt-1 flex items-center gap-2 text-xs font-medium text-[#ff6b6b] transition-colors hover:text-[#ff8585]"
            disabled={isOverlay}
          >
            <Calendar className="h-3 w-3" />
            {dateText}
          </button>
        </div>

        {!isOverlay && onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="rounded-full p-2 text-white/40 opacity-0 transition-all group-hover:opacity-100 hover:bg-red-400/10 hover:text-red-400 focus:opacity-100"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        <div className="absolute left-[2.85rem] top-full h-4 w-px -translate-x-1/2 bg-white/5 last:hidden" />
      </motion.div>

      {!isOverlay && (
        <DatePicker
          open={showDatePicker}
          onClose={() => setShowDatePicker(false)}
          onSelect={onUpdateDates}
          selectedDateRange={selectedRange}
        />
      )}
    </>
  )
}

