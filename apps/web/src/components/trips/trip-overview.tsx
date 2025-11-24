"use client"

import { motion } from "framer-motion"
import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import {
  Plus,
  MoreHorizontal,
  Search,
  X,
  Calendar,
  FileText,
  Mail,
  ImageIcon,
  FileType,
  LinkIcon,
  Lock,
  CreditCard,
  Bed,
  Utensils,
  DollarSign,
  Zap,
  Users,
  Settings,
  Edit3,
  Trash2,
  Share2,
  Pencil,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Trip } from "@gotrippin/core"
import { formatTripDate, calculateDaysUntil, calculateDuration } from "@/lib/api/trips"
import { useTranslation } from "react-i18next"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DatePicker } from "./date-picker"
import { BackgroundPicker } from "./background-picker"
import WeatherWidget from "./weather-widget"
import type { DateRange } from "react-day-picker"
import type { WeatherData } from "@gotrippin/core"

interface TripOverviewProps {
  trip: Trip
  onNavigate: (screen: "activity" | "flight") => void
  onBack: () => void
  onEdit?: () => void
  onDelete?: () => void
  onShare?: () => void
  onManageGuests?: () => void
  onEditName?: () => void
  onChangeDates?: (dateRange: DateRange | undefined) => void
  onChangeBackground?: (type: "image" | "color", value: string) => void
}

export default function TripOverview({
  trip,
  onNavigate,
  onBack,
  onEdit,
  onDelete,
  onShare,
  onManageGuests,
  onEditName,
  onChangeDates,
  onChangeBackground,
}: TripOverviewProps) {
  const { t } = useTranslation()
  const [dominantColor, setDominantColor] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showBackgroundPicker, setShowBackgroundPicker] = useState(false)
  const [scrollY, setScrollY] = useState(0)
  const rafRef = useRef<number | null>(null)

  // Calculate trip details - memoize to prevent recalculation on every render
  const { daysUntil, duration, startDate, endDate } = useMemo(() => ({
    daysUntil: trip.start_date ? calculateDaysUntil(trip.start_date) : 0,
    duration: trip.start_date && trip.end_date ? calculateDuration(trip.start_date, trip.end_date) : 0,
    startDate: trip.start_date ? formatTripDate(trip.start_date) : "TBD",
    endDate: trip.end_date ? formatTripDate(trip.end_date) : "TBD",
  }), [trip.start_date, trip.end_date])

  // Check if trip.color is a gradient
  const isGradient = trip.color ? trip.color.startsWith('linear-gradient') : false
  const backgroundColor = trip.image_url
    ? 'transparent'
    : (dominantColor || trip.color || '#ff6b6b')

  // Throttled scroll handler using requestAnimationFrame for smooth performance
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop

    // Cancel previous RAF if it exists
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
    }

    // Schedule update on next frame
    rafRef.current = requestAnimationFrame(() => {
      setScrollY(scrollTop)
      rafRef.current = null
    })
  }, [])

  // Cleanup RAF on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [])

  useEffect(() => {
    // Reset dominant color when image_url changes or is removed
    if (!trip.image_url) {
      setDominantColor(null)
      return
    }

    const img = new Image()
    img.crossOrigin = "Anonymous"
    img.src = trip.image_url

    img.onload = () => {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      if (!ctx) return

      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imageData.data
      let r = 0,
        g = 0,
        b = 0
      const sampleSize = 10

      for (let i = 0; i < data.length; i += 4 * sampleSize) {
        r += data[i]
        g += data[i + 1]
        b += data[i + 2]
      }

      const pixelCount = data.length / (4 * sampleSize)
      r = Math.floor(r / pixelCount)
      g = Math.floor(g / pixelCount)
      b = Math.floor(b / pixelCount)

      const hexColor = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
      setDominantColor(hexColor)
    }

    img.onerror = () => {
      setDominantColor(null)
    }
  }, [trip.image_url, trip.color])

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Fixed background image at the top - show for images and solid colors, but not gradients */}
      {(!isGradient || trip.image_url) && (
        <>
          <div
            className="fixed top-0 left-0 w-full h-[45vh] z-[1]"
            style={{
              background: trip.image_url ? 'transparent' : (isGradient ? 'transparent' : backgroundColor),
            }}
          >
            {trip.image_url ? (
              <img
                src={trip.image_url}
                alt={trip.destination || "Trip destination"}
                className="w-full h-full object-cover"
                style={{
                  maskImage: 'linear-gradient(to bottom, black 0%, black 60%, transparent 100%)',
                  WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 60%, transparent 100%)',
                }}
                onError={(e) => {
                  // Fallback to color if image fails to load
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.parentElement!.style.background = dominantColor || trip.color || '#ff6b6b';
                }}
              />
            ) : null}
            {/* Dark overlay for text readability */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.1) 100%)',
              }}
            />
          </div>

          {/* Gradient fade from image to background - only for image/solid color (not gradients) */}
          {!isGradient && (
            <div
              className="fixed left-0 w-full pointer-events-none z-[2]"
              style={{
                top: '45vh',
                height: '20vh',
                background: `linear-gradient(to bottom, transparent 0%, var(--color-background) 100%)`,
              }}
            />
          )}

          {/* Gradient overlay that stretches up as you scroll - color to transparent going up */}
          <div
            className="fixed left-0 w-full pointer-events-none z-[3]"
            style={{
              bottom: 0,
              height: `calc(90vh + ${scrollY * 1.5}px)`,
              background: `linear-gradient(to top, 
                ${dominantColor || trip.color || '#ff6b6b'} 0%,
                ${dominantColor || trip.color || '#ff6b6b'} 50%,
                ${dominantColor || trip.color || '#ff6b6b'}dd 70%,
                ${dominantColor || trip.color || '#ff6b6b'}99 85%,
                transparent 100%)`,
              willChange: 'height',
            }}
          />
        </>
      )}

      {/* Sticky header with collapsing title */}
      <div className="fixed top-0 left-0 right-0 z-30">
        {/* Header background - fades in when scrolling */}
        <motion.div
          className="absolute inset-0 backdrop-blur-xl"
          style={{
            background: `${dominantColor || trip.color || '#ff6b6b'}f0`,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: scrollY > 200 ? 1 : 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        />

        <div className="relative p-4 flex items-center justify-between">
          {/* Left: Menu button */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <motion.button
                className="w-12 h-12 rounded-full backdrop-blur-md border border-white/20 flex items-center justify-center overflow-hidden"
                style={{ background: "rgba(0,0,0,0.3)" }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <MoreHorizontal className="w-5 h-5 text-white" />
              </motion.button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              sideOffset={8}
              className="min-w-[200px] bg-[#0e0b10]/95 backdrop-blur-xl border border-white/10 rounded-xl p-2 shadow-2xl"
              style={{
                boxShadow: "0 8px 32px -8px rgba(0, 0, 0, 0.8)",
              }}
            >
              {onShare && (
                <DropdownMenuItem
                  onClick={onShare}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white cursor-pointer transition-colors hover:bg-[#ff6b6b]/20 focus:bg-[#ff6b6b]/20"
                >
                  <Share2 className="w-4 h-4" />
                  <span className="text-sm font-medium">{t('trip_overview.menu_share_trip')}</span>
                </DropdownMenuItem>
              )}
              {onManageGuests && (
                <DropdownMenuItem
                  onClick={onManageGuests}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white cursor-pointer transition-colors hover:bg-[#ff6b6b]/20 focus:bg-[#ff6b6b]/20"
                >
                  <Users className="w-4 h-4" />
                  <span className="text-sm font-medium">{t('trip_overview.menu_manage_guests')}</span>
                </DropdownMenuItem>
              )}
              {onEditName && (
                <DropdownMenuItem
                  onClick={onEditName}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white cursor-pointer transition-colors hover:bg-[#ff6b6b]/20 focus:bg-[#ff6b6b]/20"
                >
                  <Pencil className="w-4 h-4" />
                  <span className="text-sm font-medium">{t('trip_overview.menu_edit_name')}</span>
                </DropdownMenuItem>
              )}
              {onChangeDates && (
                <DropdownMenuItem
                  onClick={() => setShowDatePicker(true)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white cursor-pointer transition-colors hover:bg-[#ff6b6b]/20 focus:bg-[#ff6b6b]/20"
                >
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm font-medium">{t('trip_overview.menu_change_dates')}</span>
                </DropdownMenuItem>
              )}
              {onChangeBackground && (
                <DropdownMenuItem
                  onClick={() => setShowBackgroundPicker(true)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white cursor-pointer transition-colors hover:bg-[#ff6b6b]/20 focus:bg-[#ff6b6b]/20"
                >
                  <ImageIcon className="w-4 h-4" />
                  <span className="text-sm font-medium">{t('trip_overview.menu_change_background')}</span>
                </DropdownMenuItem>
              )}
              {(onEdit || onDelete) && <DropdownMenuSeparator className="bg-white/10 my-2" />}
              {onEdit && (
                <DropdownMenuItem
                  onClick={onEdit}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white cursor-pointer transition-colors hover:bg-[#ff6b6b]/20 focus:bg-[#ff6b6b]/20"
                >
                  <Edit3 className="w-4 h-4" />
                  <span className="text-sm font-medium">{t('trips.edit')}</span>
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem
                  onClick={() => setShowDeleteConfirm(true)}
                  variant="destructive"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-400 cursor-pointer hover:bg-red-500/20 focus:bg-red-500/20 transition-colors data-[variant=destructive]:text-red-400"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="text-sm font-medium">{t('trip_overview.menu_remove_trip')}</span>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Center: Collapsed title - morphs in when scrolling */}
          <motion.div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{
              opacity: scrollY > 200 ? 1 : 0,
              scale: scrollY > 200 ? 1 : 0.8,
              y: scrollY > 200 ? 0 : 20
            }}
            transition={{
              duration: 0.4,
              ease: [0.4, 0.0, 0.2, 1], // Custom easing for smooth morph
              opacity: { duration: 0.3 },
              scale: { duration: 0.4 },
              y: { duration: 0.4 }
            }}
          >
            <div className="text-center">
              <h2 className="text-lg font-bold text-white whitespace-nowrap">
                {trip.destination || trip.title || t('trips.untitled_trip')}
              </h2>
              <p className="text-xs text-white/70 whitespace-nowrap">
                {startDate} → {endDate}
              </p>
            </div>
          </motion.div>

          {/* Right: Search and close buttons */}
          <div className="flex gap-3">
            <motion.button
              className="w-12 h-12 rounded-full backdrop-blur-md border border-white/20 flex items-center justify-center overflow-hidden"
              style={{ background: "rgba(0,0,0,0.3)" }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Search className="w-5 h-5 text-white" />
            </motion.button>
            <motion.button
              onClick={onBack}
              className="w-12 h-12 rounded-full backdrop-blur-md border border-white/20 flex items-center justify-center overflow-hidden"
              style={{ background: "rgba(0,0,0,0.3)" }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <X className="w-5 h-5 text-white" />
            </motion.button>
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div
        className="relative h-screen overflow-y-auto scrollbar-hide z-[10]"
        style={{
          background: isGradient && !trip.image_url && trip.color
            ? trip.color
            : 'transparent'
        }}
        onScroll={handleScroll}
      >
        <motion.div
          className="relative z-10 px-6 pt-60 pb-6 text-center"
          initial="hidden"
          animate={scrollY > 200 ? "hidden" : "visible"}
          variants={{
            hidden: {
              opacity: 0,
              y: -20,
              transition: {
                duration: 0.4,
                ease: [0.4, 0.0, 0.2, 1],
              }
            },
            visible: {
              opacity: 1,
              y: 0,
              transition: {
                staggerChildren: 0.1,
                duration: 0.4,
                ease: [0.4, 0.0, 0.2, 1],
              },
            },
          }}
        >
          <motion.h1
            className="text-5xl font-bold text-white mb-3 drop-shadow-lg"
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 },
            }}
          >
            {trip.destination || trip.title || t('trips.untitled_trip')}
          </motion.h1>
          <motion.p
            className="text-white/90 text-base mb-1 drop-shadow-md"
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 },
            }}
          >
            {daysUntil > 0 ? t('trips.starts_in', { count: daysUntil }) : t('trips.started')} • {duration > 0 ? t('trips.day_trip', { count: duration }) : t('trips.duration_tbd')}
          </motion.p>
          <motion.p
            className="text-white/70 text-sm drop-shadow-md"
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 },
            }}
          >
            {startDate} → {endDate}
          </motion.p>
        </motion.div>



        <motion.div
          className="relative z-10 flex flex-col items-center gap-2 pt-8 pb-12"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <motion.button
            onClick={() => onNavigate("activity")}
            className="w-16 h-16 rounded-full flex items-center justify-center backdrop-blur-md border border-white/20 shadow-2xl"
            style={{
              background: "rgba(0, 0, 0, 0.3)",
            }}
            whileHover={{
              scale: 1.1,
              rotate: 90,
            }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <Plus className="w-8 h-8 text-white" strokeWidth={2.5} />
          </motion.button>
          <span className="text-white/80 text-sm">{t('trip_overview.add_first_activity')}</span>
        </motion.div>

        <div className="relative z-10 px-6 pb-8 space-y-4">
          {/* Itinerary Card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <Card
              className="border-white/[0.08] rounded-2xl p-5 bg-[var(--color-card)]"
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: "#ff6b6b" }}
                >
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="text-base font-semibold text-white">{t('trip_overview.itinerary')}</h2>
                  <span className="text-xs text-[var(--muted)]">{startDate}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm mb-3">
                <Plus className="w-4 h-4" style={{ color: "#ff6b6b" }} />
                <span className="text-[var(--muted)]">{t('trip_overview.start_organizing')}</span>
              </div>
              <button className="font-semibold text-sm" style={{ color: "#ff6b6b" }}>
                {t('trip_overview.view_all_days')}
              </button>
            </Card>
          </motion.div>

          {/* Weather Widget */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}>
            <div onClick={() => onNavigate("weather" as any)}>
              <WeatherWidget
                color={dominantColor || trip.color || '#ff6b6b'}
                weather={{
                  location: trip.destination || "Tokyo",
                  current: {
                    temperature: 15,
                    temperatureApparent: 14,
                    humidity: 65,
                    weatherCode: 1000,
                    description: "Clear, Sunny",
                    windSpeed: 10,
                    windDirection: 180,
                    cloudCover: 20,
                    uvIndex: 5,
                  },
                  forecast: [], // Forecast not needed for summary card
                }}
              />
            </div>
          </motion.div>

          {/* Documents Card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
            <Card
              className="border-white/[0.08] rounded-2xl p-5 bg-[var(--color-card)]"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-base font-semibold text-white">{t('trip_overview.documents')}</h2>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    className="text-xs font-bold px-2 py-1 rounded border-0"
                    style={{ background: "#ff6b6b", color: "white" }}
                  >
                    {t('trip_overview.pro_badge')}
                  </Badge>
                  <Lock className="w-4 h-4 text-white/40" />
                </div>
              </div>

              <div className="flex justify-center gap-6 mb-4 py-4">
                <Mail className="w-6 h-6 text-white/40" />
                <ImageIcon className="w-6 h-6 text-white/40" />
                <FileType className="w-6 h-6 text-white/40" />
                <LinkIcon className="w-6 h-6 text-white/40" />
              </div>

              <p className="text-[var(--muted)] text-sm text-center mb-4">
                {t('trip_overview.add_documents_description')}
              </p>

              <button className="w-full font-semibold text-sm" style={{ color: "#ff6b6b" }}>
                {t('trip_overview.add_document')}
              </button>
            </Card>
          </motion.div>

          {/* Invite Guests Card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
            <Card
              className="border-white/[0.08] rounded-2xl p-5 bg-[var(--color-card)]"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-base font-semibold text-white">{t('trip_overview.invite_guests')}</h2>
              </div>

              <p className="text-[var(--muted)] text-sm mb-4">
                {t('trip_overview.invite_guests_description')}
              </p>

              <button className="w-full font-semibold text-sm" style={{ color: "#ff6b6b" }}>
                {t('trip_overview.share_trip')}
              </button>
            </Card>
          </motion.div>

          <motion.div
            className="flex justify-center pt-4 pb-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <motion.button
              className="px-6 py-3 rounded-full backdrop-blur-md border border-white/20 flex items-center gap-2 overflow-hidden"
              style={{ background: "rgba(255,255,255,0.1)" }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Settings className="w-5 h-5 text-white" />
              <span className="text-white font-semibold">{t('trip_overview.customize')}</span>
            </motion.button>
          </motion.div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShowDeleteConfirm(false)}
        >
          <motion.div
            className="bg-[#0e0b10] border border-white/10 rounded-2xl p-6 mx-6 max-w-md w-full"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">{t('trip_overview.delete_trip')}</h3>
                <p className="text-sm text-white/60">{t('trip_overview.delete_confirmation')}</p>
              </div>
            </div>
            <p className="text-white/80 mb-6">
              {t('trip_overview.delete_message', { tripName: trip.destination || trip.title })}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 rounded-lg bg-white/10 text-white font-medium hover:bg-white/20 transition-colors"
              >
                {t('trips.cancel')}
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false)
                  onDelete?.()
                }}
                className="flex-1 px-4 py-2 rounded-lg bg-red-500 text-white font-medium hover:bg-red-600 transition-colors"
              >
                {t('trip_overview.delete')}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Date Picker Modal */}
      {onChangeDates && (
        <DatePicker
          open={showDatePicker}
          onClose={() => setShowDatePicker(false)}
          onSelect={(dateRange) => {
            onChangeDates(dateRange)
            setShowDatePicker(false)
          }}
          selectedDateRange={
            trip.start_date && trip.end_date
              ? {
                from: new Date(trip.start_date),
                to: new Date(trip.end_date),
              }
              : trip.start_date
                ? {
                  from: new Date(trip.start_date),
                  to: undefined,
                }
                : undefined
          }
        />
      )}

      {/* Background Picker Modal */}
      {onChangeBackground && (
        <BackgroundPicker
          open={showBackgroundPicker}
          onClose={() => setShowBackgroundPicker(false)}
          onSelect={(type, value) => {
            onChangeBackground(type, value)
            setShowBackgroundPicker(false)
          }}
          defaultSearchQuery={trip.destination || trip.title || undefined}
        />
      )}
    </div>
  )
}

