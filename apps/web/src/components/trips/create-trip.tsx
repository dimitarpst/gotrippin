"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CalendarIcon, ImageIcon } from "lucide-react"
import { BackgroundPicker } from "./background-picker"
import { DatePicker } from "./date-picker"
import type { DateRange } from "react-day-picker"

interface CreateTripProps {
  onBack: () => void
  onSave: (data: { title: string; imageUrl?: string; color?: string; dateRange?: DateRange }) => Promise<void>
  initialData?: {
    title: string
    imageUrl?: string
    color?: string
    dateRange?: DateRange
  }
  isEditing?: boolean
}

export default function CreateTrip({ onBack, onSave, initialData, isEditing = false }: CreateTripProps) {
  const [tripName, setTripName] = useState(initialData?.title || "")
  const [showBackgroundPicker, setShowBackgroundPicker] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(initialData?.imageUrl || null)
  const [selectedColor, setSelectedColor] = useState<string | null>(initialData?.color || null)
  const [dateRange, setDateRange] = useState<DateRange | undefined>(initialData?.dateRange)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!tripName.trim()) return

    setSaving(true)
    try {
      await onSave({
        title: tripName,
        imageUrl: selectedImage || undefined,
        color: selectedColor || undefined,
        dateRange,
      })
    } catch (error) {
      console.error("Failed to save trip:", error)
    } finally {
      setSaving(false)
    }
  }

  const handleBackgroundSelect = (type: "image" | "color", value: string) => {
    if (type === "image") {
      setSelectedImage(value)
      setSelectedColor(null)
    } else {
      setSelectedColor(value)
      setSelectedImage(null)
    }
    setShowBackgroundPicker(false)
  }

  const formatDateRange = () => {
    if (!dateRange?.from) return "No date set"
    if (!dateRange.to) {
      const month = dateRange.from.toLocaleDateString("en-US", { month: "short" })
      const day = dateRange.from.getDate()
      return `${month} ${day}`
    }
    const fromMonth = dateRange.from.toLocaleDateString("en-US", { month: "short" })
    const fromDay = dateRange.from.getDate()
    const toMonth = dateRange.to.toLocaleDateString("en-US", { month: "short" })
    const toDay = dateRange.to.getDate()
    return `${fromMonth} ${fromDay} → ${toMonth} ${toDay}`
  }

  return (
    <>
      <div className="min-h-screen relative overflow-hidden flex flex-col">
        <div className="fixed inset-0 -z-10">
          <AnimatePresence mode="wait">
            {selectedImage ? (
              <motion.div
                key="image"
                className="absolute inset-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <img
                  src={selectedImage || "/placeholder.svg"}
                  alt="Trip background"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80" />
              </motion.div>
            ) : selectedColor ? (
              <motion.div
                key="color"
                className="absolute inset-0"
                style={{ backgroundColor: selectedColor }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60" />
              </motion.div>
            ) : (
              <motion.div
                key="default"
                className="absolute inset-0"
                style={{
                  background:
                    "radial-gradient(circle at 20% 50%, rgba(255, 107, 107, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(255, 107, 107, 0.1) 0%, transparent 50%), #0a0a0a",
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
            )}
          </AnimatePresence>
        </div>

        <div className="relative z-10 px-6 pt-12 flex items-center justify-between">
          <button onClick={onBack} className="text-[#ff6b6b] text-lg font-medium" disabled={saving}>
            Cancel
          </button>
          <button 
            onClick={handleSave} 
            className="px-6 py-2 rounded-full bg-white text-black font-semibold disabled:opacity-50"
            disabled={!tripName.trim() || saving}
          >
            {saving ? (isEditing ? "Updating..." : "Saving...") : (isEditing ? "Update" : "Save")}
          </button>
        </div>

        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 pb-32">
          <input
            type="text"
            value={tripName}
            onChange={(e) => setTripName(e.target.value)}
            placeholder="Trip name"
            className="w-full bg-transparent border-none text-white text-5xl font-bold placeholder:text-white/40 focus:outline-none text-center mb-4"
            style={{ caretColor: "#ff6b6b" }}
          />
          <p className="text-white/60 text-lg">{formatDateRange()}</p>
        </div>

        <div className="relative z-10 px-6 pb-12 flex items-center justify-center gap-1">
          <button
            onClick={() => setShowDatePicker(true)}
            className="flex-1 flex flex-col items-center gap-2 py-4 text-white/80 hover:text-white transition-colors"
          >
            <CalendarIcon className="w-6 h-6" />
            <span className="text-sm font-medium">Set Dates</span>
          </button>

          <div className="w-px h-12 bg-white/20" />

          <button
            onClick={() => setShowBackgroundPicker(true)}
            className="flex-1 flex flex-col items-center gap-2 py-4 text-white/80 hover:text-white transition-colors"
          >
            <ImageIcon className="w-6 h-6" />
            <span className="text-sm font-medium">Background</span>
          </button>
        </div>
      </div>

      <BackgroundPicker
        open={showBackgroundPicker}
        onClose={() => setShowBackgroundPicker(false)}
        onSelect={handleBackgroundSelect}
      />
      
      <DatePicker
        open={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        onSelect={setDateRange}
        selectedDateRange={dateRange}
      />
    </>
  )
}

