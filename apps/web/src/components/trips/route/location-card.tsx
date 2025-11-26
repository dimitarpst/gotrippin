"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical, MapPin, Calendar, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { useState } from "react"
import { DatePicker } from "../date-picker"
import { DateRange } from "react-day-picker"

interface LocationCardProps {
  id: string
  name: string
  index: number
  arrivalDate?: string | null
  departureDate?: string | null
  onRemove: () => void
  onUpdateDates: (range: DateRange | undefined) => void
  onUpdateName: (name: string) => void
  /**
   * If true, this card is rendered inside a DragOverlay and should not handle interactions
   */
  isOverlay?: boolean
}

export function LocationCard({ 
  id, 
  name, 
  index, 
  arrivalDate, 
  departureDate, 
  onRemove, 
  onUpdateDates,
  onUpdateName,
  isOverlay = false,
}: LocationCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id })

  const [showDatePicker, setShowDatePicker] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  }

  // Convert string dates to Date objects for the picker
  const selectedRange: DateRange | undefined = arrivalDate ? {
    from: new Date(arrivalDate),
    to: departureDate ? new Date(departureDate) : undefined
  } : undefined

  const dateText = selectedRange?.from 
    ? `${format(selectedRange.from, 'MMM d')}${selectedRange.to ? ` - ${format(selectedRange.to, 'MMM d')}` : ''}`
    : "Set dates"

  return (
    <>
      <motion.div
        ref={isOverlay ? undefined : setNodeRef}
        style={isOverlay ? undefined : style}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          "group relative flex items-center gap-4 p-4 rounded-2xl mb-3 select-none",
          "bg-white/5 backdrop-blur-md border border-white/10",
          "transition-all duration-200 hover:bg-white/10 hover:border-white/20",
          isDragging && !isOverlay && "shadow-2xl scale-105 border-[#ff6b6b]/50 bg-[#1c1c1e]",
          isDragging && !isOverlay && "opacity-0" // hide original card while overlay is active
        )}
      >
        {/* Drag Handle */}
        {!isOverlay && (
          <div 
            {...attributes} 
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-2 -ml-2 text-white/20 hover:text-white/60 transition-colors"
          >
            <GripVertical className="w-5 h-5" />
          </div>
        )}
        {isOverlay && (
          <div className="p-2 -ml-2 text-white/30">
            <GripVertical className="w-5 h-5 opacity-0" />
          </div>
        )}

        {/* Order Badge */}
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-xs font-medium text-white/60 border border-white/5">
          {index + 1}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <input
            value={name}
            onChange={(e) => onUpdateName(e.target.value)}
            placeholder="Enter location name"
            className="w-full bg-transparent text-lg font-semibold text-white placeholder:text-white/20 outline-none border-none p-0 focus:ring-0"
          />
          
          <button 
            onClick={() => setShowDatePicker(true)}
            className="flex items-center gap-2 mt-1 text-xs font-medium text-[#ff6b6b] hover:text-[#ff8585] transition-colors"
          >
            <Calendar className="w-3 h-3" />
            {dateText}
          </button>
        </div>

        {/* Actions */}
        {!isOverlay && (
          <div className="flex items-center gap-2">
            <button
              onClick={onRemove}
              className={cn(
                "p-2 rounded-full text-white/40 hover:text-red-400 hover:bg-red-400/10 transition-all",
                "opacity-0 group-hover:opacity-100 focus:opacity-100"
              )}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Connecting Line (visual decoration) */}
        <div className="absolute left-[2.85rem] top-full w-[2px] h-4 bg-white/5 -translate-x-1/2 z-0 last:hidden" />
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

