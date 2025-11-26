"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CalendarIcon, ImageIcon, ArrowRight, ArrowLeft } from "lucide-react"
import { BackgroundPicker } from "./background-picker"
import { DatePicker } from "./date-picker"
import type { DateRange } from "react-day-picker"
import { useTranslation } from "react-i18next"
import { RouteBuilder, type RouteLocation } from "./route/route-builder"

interface CreateTripProps {
  onBack: () => void
  onSave: (data: { 
    title: string; 
    imageUrl?: string; 
    color?: string; 
    dateRange?: DateRange;
    locations?: RouteLocation[];
  }) => Promise<void>
  initialData?: {
    title: string
    imageUrl?: string
    color?: string
    dateRange?: DateRange
    locations?: RouteLocation[]
  }
  isEditing?: boolean
}

type Step = "details" | "route"

export default function CreateTrip({ onBack, onSave, initialData, isEditing = false }: CreateTripProps) {
  const { t } = useTranslation()
  const [step, setStep] = useState<Step>("details")
  
  // Details State
  const [tripName, setTripName] = useState(initialData?.title || "")
  const [showBackgroundPicker, setShowBackgroundPicker] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(initialData?.imageUrl || null)
  const [selectedColor, setSelectedColor] = useState<string | null>(initialData?.color || null)
  const [dateRange, setDateRange] = useState<DateRange | undefined>(initialData?.dateRange)
  
  // Route State
  const [locations, setLocations] = useState<RouteLocation[]>(initialData?.locations || [])
  
  const [saving, setSaving] = useState(false)

  const handleContinue = () => {
    if (isEditing) {
      // In edit mode we only use the details view
      handleSave()
      return
    }

    if (step === "details") {
      if (!tripName.trim()) return
      setStep("route")
    } else {
      handleSave()
    }
  }

  const handleBackStep = () => {
    if (isEditing) {
      onBack()
      return
    }

    if (step === "route") {
      setStep("details")
    } else {
      onBack()
    }
  }

  const handleSave = async () => {
    // Basic validation
    if (!tripName.trim()) return
    if (!isEditing && locations.length < 2) return // Should be handled by UI, but double check

    setSaving(true)
    try {
      await onSave({
        title: tripName,
        imageUrl: selectedImage || undefined,
        color: selectedColor || undefined,
        dateRange,
        locations,
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
    if (!dateRange?.from) return t('trips.no_date_set')
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

  const renderBackground = () => (
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
            style={{ 
              background: selectedColor.startsWith('linear-gradient') 
                ? selectedColor 
                : undefined,
              backgroundColor: selectedColor.startsWith('linear-gradient') 
                ? undefined 
                : selectedColor 
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {!selectedColor.startsWith('linear-gradient') && (
              <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60" />
            )}
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
      {/* Global dark overlay to ensure content is always readable over backgrounds */}
      <div className="absolute inset-0 bg-black/55" />
    </div>
  )

  return (
    <>
      <div className="min-h-screen relative overflow-hidden flex flex-col">
        {renderBackground()}

        <div className="relative z-10 px-6 pt-12 flex items-center justify-between">
          <button 
            onClick={handleBackStep} 
            className="px-4 py-2 rounded-full text-[#ff6b6b] text-lg font-medium backdrop-blur-md border border-white/20 disabled:opacity-50 hover:bg-white/5 transition-colors"
            disabled={saving}
          >
            {!isEditing && step === "route" ? (
              <div className="flex items-center gap-2">
                <ArrowLeft className="w-5 h-5" />
                Back
              </div>
            ) : (
              t('trips.cancel')
            )}
          </button>
          
          {!isEditing && (
            <div className="flex gap-2">
              <div className={`w-2 h-2 rounded-full ${step === 'details' ? 'bg-white' : 'bg-white/20'}`} />
              <div className={`w-2 h-2 rounded-full ${step === 'route' ? 'bg-white' : 'bg-white/20'}`} />
            </div>
          )}

          <button 
            onClick={handleContinue} 
            className="px-6 py-2 rounded-full bg-white text-black font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/90 transition-colors flex items-center gap-2"
            disabled={
              (!tripName.trim()) || 
              (!isEditing && step === "route" && (locations.length < 2 || saving)) ||
              saving
            }
          >
            {(!isEditing && step === "details") ? (
              <>
                Next <ArrowRight className="w-4 h-4" />
              </>
            ) : (
              saving ? (isEditing ? t('trips.updating') : t('trips.saving')) : (isEditing ? t('trips.update') : t('trips.save'))
            )}
          </button>
        </div>

        <AnimatePresence mode="wait">
          {step === "details" || isEditing ? (
            <motion.div 
              key="details"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 flex flex-col"
            >
              <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 pb-32">
                <input
                  type="text"
                  value={tripName}
                  onChange={(e) => setTripName(e.target.value)}
                  placeholder={t('trips.trip_name')}
                  className="w-full bg-transparent border-none text-white text-5xl font-bold placeholder:text-white/40 focus:outline-none text-center mb-4"
                  style={{ caretColor: "#ff6b6b" }}
                  autoFocus
                />
                <p className="text-white/60 text-lg">{formatDateRange()}</p>
              </div>

              <div className="relative z-10 px-6 pb-12 flex items-center justify-center gap-1">
                <button
                  onClick={() => setShowDatePicker(true)}
                  className="flex-1 flex flex-col items-center gap-2 py-4 text-white/80 hover:text-white transition-colors"
                >
                  <CalendarIcon className="w-6 h-6" />
                  <span className="text-sm font-medium">{t('trips.set_dates')}</span>
                </button>

                <div className="w-px h-12 bg-white/20" />

                <button
                  onClick={() => setShowBackgroundPicker(true)}
                  className="flex-1 flex flex-col items-center gap-2 py-4 text-white/80 hover:text-white transition-colors"
                >
                  <ImageIcon className="w-6 h-6" />
                  <span className="text-sm font-medium">{t('trips.background')}</span>
                </button>
              </div>
            </motion.div>
          ) : !isEditing && step === "route" ? (
            <motion.div
              key="route"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex-1 relative z-10 px-6 py-8 overflow-y-auto"
            >
              <div className="max-w-md mx-auto pb-20">
                <RouteBuilder 
                  locations={locations} 
                  onChange={setLocations} 
                />
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {!isEditing && (
        <BackgroundPicker
          open={showBackgroundPicker}
          onClose={() => setShowBackgroundPicker(false)}
          onSelect={handleBackgroundSelect}
        />
      )}
      
      <DatePicker
        open={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        onSelect={setDateRange}
        selectedDateRange={dateRange}
      />
    </>
  )
}
