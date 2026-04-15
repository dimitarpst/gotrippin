"use client"

import { AnimatePresence, motion } from "framer-motion"
import { useState, useEffect, useLayoutEffect, useRef, useCallback, useMemo } from "react"
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
  Plane,
  MapPin,
  Utensils,
  Zap,
  Users,
  Settings,
  Edit3,
  Trash2,
  Share2,
  Pencil,
  ArrowRight,
  Map as MapIcon,
  FileDown,
  AlertTriangle,
  NotebookPen,
  Images,
  Wallet,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Trip, TripLocation, Activity, TripLocationWeather } from "@gotrippin/core"
import {
  formatTripDate,
  calculateDaysUntil,
  calculateDuration,
  averageRgbFromImageDataSampled,
  rgbToHex,
} from "@gotrippin/core"
import { useTranslation } from "react-i18next"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { DatePicker } from "./date-picker"
import { BackgroundPicker } from "./background-picker"
import WeatherWidget from "./weather-widget"
import {
  WeatherUnavailableIndicator,
  WeatherUnavailableSummaryCard,
} from "./weather-unavailable-indicator"
import type { DateRange } from "react-day-picker"
import type { WeatherData } from "@gotrippin/core"
import { format } from "date-fns"
import { resolveTripCoverUrl } from "@/lib/r2-public"
import { updateTripCoverDominantColor } from "@/lib/api/trips"
import { CoverImageWithBlur } from "@/components/ui/cover-image-with-blur"
import { toast } from "sonner"
import { MapView, tripLocationsToWaypoints } from "@/components/maps"
import { useRouteDirections } from "@/hooks"
import { getStablePaletteColorForLocationId, isSolidRouteColor } from "@/lib/route-colors"
export interface TripOverviewActions {
  onNavigate: (
    screen:
      | "activity"
      | "flight"
      | "lodging"
      | "place"
      | "weather"
      | "map"
      | "notes"
      | "gallery"
      | "timeline"
      | "budget",
  ) => void
  onOpenLocation?: (locationId: string) => void
  onBack: () => void
  onEdit?: () => void
  onDelete?: () => void
  onShare?: () => void
  /** Open invite-by-email flow (parent owns dialog / API). */
  onInviteByEmail?: () => void
  onManageGuests?: () => void
  onEditName?: () => void
  onChangeDates?: (dateRange: DateRange | undefined) => void | Promise<void>
  onChangeBackground?: (type: "image", value: import("@gotrippin/core").CoverPhotoInput) => void
  /** Device upload already in R2; persists via `cover_upload_storage_key` on trip update. */
  onChangeBackgroundUpload?: (payload: { storage_key: string }) => void
  onChangeBackgroundColor?: (color: string) => void
  /** Download a printable PDF of the trip (route + activities). */
  onExportTripPdf?: () => void | Promise<void>
}

export interface TripOverviewTimeline {
  routeLocations?: TripLocation[]
  routeLoading?: boolean
  timelineLocations?: TripLocation[]
  activitiesByLocation?: Record<string, Activity[]>
  /** Activities not tied to a route stop; included in trip date picker timeline dots. */
  unassignedActivities?: Activity[]
  loading?: boolean
  error?: string | null
  onRefetch?: () => Promise<void>
}

export interface TripOverviewWeather {
  byLocation?: Record<string, TripLocationWeather>
  fetchedAt?: number | null
  loading?: boolean
  error?: string | null
  onRefetch?: () => Promise<void>
}

/** Max stops shown in the overview itinerary card before "show all". */
const ITINERARY_OVERVIEW_VISIBLE_MAX = 3

/** Phase 2: slightly tighter overview cards; mobile a notch denser, sm+ stays comfortable. */
const TRIP_OVERVIEW_CARD_PADDING = "p-4 sm:p-5"

/** Same glassy black treatment as the floating header (search / close). */
const TRIP_OVERVIEW_QUICK_ACTION_GLASS_CLASS =
  "mx-auto flex size-[4.5rem] shrink-0 items-center justify-center rounded-full border border-white/20 bg-black/30 text-white shadow-none backdrop-blur-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/55 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent sm:size-[5rem]"

/** Primary add — brand coral, aligned with header border weight. */
const TRIP_OVERVIEW_QUICK_ACTION_CORAL_CLASS =
  "mx-auto flex size-[4.5rem] shrink-0 items-center justify-center rounded-full border border-white/25 bg-[#ff7670] text-white shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/55 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent sm:size-[5rem]"

/** Pixels above the measured hero bottom where the accent reaches full opacity (then stays solid to viewport bottom). */
const ACCENT_SCROLL_SOLID_START_OFFSET_PX = 28

/** Scroll distance over which accent “header reveal” ramps (larger = full solid later). */
const HEADER_BG_OPACITY_FULL_SCROLL = 340

/** Header scrim: start fading in / end fully opaque (smoothed scroll px). Later = full color later. */
const HEADER_BACKDROP_START_PX = 145
const HEADER_BACKDROP_RANGE_PX = 260

/** Exponential smoothing for scroll position (0–1). Lower = slower follow, less twitchy. */
const SCROLL_SMOOTH_LERP = 0.088

/** Ignore subpixel churn when lerping (stops the RAF loop). */
const SCROLL_SMOOTH_EPSILON = 0.045

function smoothStep01(t: number): number {
  const x = Math.min(1, Math.max(0, t))
  return x * x * (3 - 2 * x)
}

/** Double smoothstep — stays transparent longer, eases in fully later (Ken Perlin-style). */
function smootherStep01(t: number): number {
  return smoothStep01(smoothStep01(t))
}

interface TripOverviewProps {
  trip: Trip
  actions: TripOverviewActions
  timeline?: TripOverviewTimeline
  weather?: TripOverviewWeather
  /** When the trip window and some stops/activities disagree, show a card above the itinerary to reopen the repair flow. */
  scheduleAttention?: {
    itemCount: number
    stopCount: number
    activityCount: number
    onReview: () => void
  }
}

export default function TripOverview({
  trip,
  actions,
  timeline: timelineProp = {},
  weather: weatherProp = {},
  scheduleAttention,
}: TripOverviewProps) {
  const {
    onNavigate,
    onBack,
    onEdit,
    onDelete,
    onShare,
    onInviteByEmail,
    onManageGuests,
    onEditName,
    onOpenLocation,
    onChangeDates,
    onChangeBackground,
    onChangeBackgroundUpload,
    onChangeBackgroundColor,
    onExportTripPdf,
  } = actions

  const {
    routeLocations = [],
    routeLoading = false,
    timelineLocations = [],
    activitiesByLocation = {},
    unassignedActivities = [],
    loading: timelineLoading = false,
    error: timelineError = null,
    onRefetch: onRefetchTimeline,
  } = timelineProp

  const {
    byLocation: weatherByLocation = {},
    fetchedAt: weatherFetchedAt = null,
    loading: weatherLoading = false,
    error: weatherError = null,
    onRefetch: onRefetchWeather,
  } = weatherProp
  const { t } = useTranslation()
  // Seed from DB value (stored at photo-selection time) — no flicker on first render.
  // Canvas extraction below will refine this value once the image loads (same-origin R2 images).
  const [dominantColor, setDominantColor] = useState<string | null>(
    (trip.cover_photo as { dominant_color?: string | null } | null | undefined)?.dominant_color ?? null
  )
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showBackgroundPicker, setShowBackgroundPicker] = useState(false)
  const [customizePopoverOpen, setCustomizePopoverOpen] = useState(false)
  const [smoothScrollY, setSmoothScrollY] = useState(0)
  const scrollTargetRef = useRef(0)
  const smoothScrollRef = useRef(0)
  const scrollSmoothRafRef = useRef<number | null>(null)
  const [viewportHeight, setViewportHeight] = useState(800)
  const [heroBottomPx, setHeroBottomPx] = useState<number | null>(null)
  const heroShellRef = useRef<HTMLDivElement>(null)

  // Calculate trip details - memoize to prevent recalculation on every render
  const { daysUntil, duration, startDate, endDate } = useMemo(() => ({
    daysUntil: trip.start_date ? calculateDaysUntil(trip.start_date) : 0,
    duration: trip.start_date && trip.end_date ? calculateDuration(trip.start_date, trip.end_date) : 0,
    startDate: trip.start_date ? formatTripDate(trip.start_date) : "—",
    endDate: trip.end_date ? formatTripDate(trip.end_date) : "—",
  }), [trip.start_date, trip.end_date])

  const hasCustomizeActions = Boolean(onEditName || onChangeDates || onChangeBackground)

  const derivedLocations = timelineLocations.length ? timelineLocations : routeLocations

  const itineraryOverviewVisible = derivedLocations.slice(0, ITINERARY_OVERVIEW_VISIBLE_MAX)
  const itineraryOverviewMoreCount = Math.max(
    0,
    derivedLocations.length - ITINERARY_OVERVIEW_VISIBLE_MAX
  )

  const datePickerTimelineContext = useMemo(
    () => ({
      locations: derivedLocations,
      activitiesByLocation,
      unassigned: unassignedActivities,
    }),
    [derivedLocations, activitiesByLocation, unassignedActivities]
  )
  const loadingRoute = timelineLoading || routeLoading
  const hasRoute = derivedLocations.length > 0
  const routeWaypoints = useMemo(() => tripLocationsToWaypoints(routeLocations), [routeLocations])
  const { routeGeo } = useRouteDirections(routeWaypoints)
  const primaryWeatherEntry = hasRoute ? weatherByLocation[derivedLocations[0].id] : undefined
  const primaryWeather = primaryWeatherEntry?.weather
  const todayLabel = useMemo(() => {
    const todayFormatted = format(new Date(), "EEEE, d MMM")
    return t("trip_overview.route_today", { date: todayFormatted })
  }, [t])

  /** Plain text dates for overview rows (no pill borders). */
  const getLocationDateOverviewCompact = (location: TripLocation) => {
    const arrival = location.arrival_date ? new Date(location.arrival_date) : null
    const departure = location.departure_date ? new Date(location.departure_date) : null
    const muted = "text-[11px] tabular-nums text-muted-foreground dark:text-white/50"
    if (arrival && departure) {
      return (
        <span className={muted}>
          {format(arrival, "MMM d")}
          <span className="mx-0.5 text-muted-foreground/70 dark:text-white/35">→</span>
          {format(departure, "MMM d")}
        </span>
      )
    }
    if (arrival) {
      return <span className={muted}>{format(arrival, "MMM d")}</span>
    }
    if (departure) {
      return <span className={muted}>{format(departure, "MMM d")}</span>
    }
    return null
  }

  const renderLocationWeather = (location: TripLocation) => {
    const entry = weatherByLocation[location.id]
    const weather = entry?.weather

    if (weatherLoading) {
      return (
        <span className="text-xs text-muted-foreground">
          {t("weather.loading", { defaultValue: "Loading weather..." })}
        </span>
      )
    }

    if (weather?.current) {
      return (
        <WeatherWidget
          variant="inline"
          minimal
          className="rounded-full border-0 bg-black/30 px-2 py-1 shadow-none backdrop-blur-md dark:border-transparent dark:bg-black/40 dark:shadow-none"
          weather={{
            ...weather,
            location: location.location_name || trip.destination || weather.location,
          }}
        />
      )
    }

    if (entry?.error) {
      return <WeatherUnavailableIndicator />
    }

    return null
  }

  const coverUrl = resolveTripCoverUrl(trip as any)
  const coverStorageKey =
    (trip.cover_photo as { storage_key?: string } | null | undefined)?.storage_key ?? null
  const persistedCoverDominant =
    (trip.cover_photo as { dominant_color?: string | null } | null | undefined)?.dominant_color ?? null

  const isGradient = trip.color ? trip.color.startsWith('linear-gradient') : false
  // When a cover image is present: use the extracted dominant color (null while loading, so no flicker).
  // When no cover image: use the stored trip color directly.
  // Never mix them — that's what caused the visible color switch on every render.
  const tripAccent = coverUrl
    ? dominantColor  // null until extraction completes → gradient fades in smoothly
    : (trip.color && !isGradient ? trip.color : null)
  const backgroundColor = coverUrl ? 'transparent' : (tripAccent ?? 'transparent')

  const runScrollSmoothing = useCallback(() => {
    scrollSmoothRafRef.current = null
    const target = scrollTargetRef.current
    let current = smoothScrollRef.current
    const diff = target - current
    if (Math.abs(diff) < SCROLL_SMOOTH_EPSILON) {
      if (current !== target) {
        current = target
        smoothScrollRef.current = target
        setSmoothScrollY(target)
      }
      return
    }
    current += diff * SCROLL_SMOOTH_LERP
    smoothScrollRef.current = current
    setSmoothScrollY(current)
    scrollSmoothRafRef.current = requestAnimationFrame(runScrollSmoothing)
  }, [])

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      scrollTargetRef.current = e.currentTarget.scrollTop
      if (scrollSmoothRafRef.current === null) {
        scrollSmoothRafRef.current = requestAnimationFrame(runScrollSmoothing)
      }
    },
    [runScrollSmoothing],
  )

  useEffect(() => {
    return () => {
      if (scrollSmoothRafRef.current !== null) {
        cancelAnimationFrame(scrollSmoothRafRef.current)
      }
    }
  }, [])

  useEffect(() => {
    scrollTargetRef.current = 0
    smoothScrollRef.current = 0
    setSmoothScrollY(0)
  }, [trip.id])

  const measureHeroBottom = useCallback(() => {
    const el = heroShellRef.current
    if (!el) return
    setHeroBottomPx(el.getBoundingClientRect().bottom)
  }, [])

  useLayoutEffect(() => {
    const update = () => {
      setViewportHeight(window.innerHeight)
      measureHeroBottom()
    }
    update()
    window.addEventListener("resize", update)
    return () => window.removeEventListener("resize", update)
  }, [measureHeroBottom, coverUrl, trip.id])

  /**
   * Same overlay geometry: `bottom: 0`, `height: calc(90vh + smoothScrollY * 1.5px)`.
   * Uses smoothed scroll + smoothstep so the accent fade and header reveal don’t step.
   */
  const accentScrollOverlayBackground = useMemo(() => {
    if (!tripAccent) return undefined
    const vh = viewportHeight
    const sy = smoothScrollY
    const overlayH = 0.9 * vh + sy * 1.5
    const yTop = vh - overlayH
    const heroBottom = heroBottomPx ?? 0.45 * vh
    const headerRevealT = smootherStep01(sy / HEADER_BG_OPACITY_FULL_SCROLL)
    const solidStart = heroBottom - ACCENT_SCROLL_SOLID_START_OFFSET_PX

    if (yTop >= solidStart) {
      return `linear-gradient(to bottom, ${tripAccent} 0%, ${tripAccent} 100%)`
    }

    const p = ((solidStart - yTop) / overlayH) * 100
    const pClamp = Math.max(0, Math.min(100, p))
    const pShifted = pClamp * (1 - headerRevealT)
    const solidMix = smoothStep01((0.52 - pShifted) / 0.52)

    if (solidMix >= 0.995) {
      return `linear-gradient(to bottom, ${tripAccent} 0%, ${tripAccent} 100%)`
    }

    const pBlend = pShifted * (1 - solidMix)

    return `linear-gradient(to bottom,
      transparent 0%,
      ${tripAccent}99 ${Math.max(0, pBlend - 14)}%,
      ${tripAccent}dd ${Math.max(0, pBlend - 5)}%,
      ${tripAccent} ${pBlend}%,
      ${tripAccent} 100%)`
  }, [tripAccent, smoothScrollY, heroBottomPx, viewportHeight])

  /** Continuous 0–1 for header scrim; stretches over HEADER_BACKDROP_* so full color comes in later. */
  const headerBackdropOpacity = useMemo(
    () => smoothStep01((smoothScrollY - HEADER_BACKDROP_START_PX) / HEADER_BACKDROP_RANGE_PX),
    [smoothScrollY],
  )

  const showCollapsedHeaderChrome = headerBackdropOpacity > 0.62

  // Seed from DB when the trip or cover *file* changes — not on every `cover_photo` reference
  // (router revalidates would reset to stale DB and wipe a successful client extraction).
  useEffect(() => {
    const stored =
      (trip.cover_photo as { dominant_color?: string | null } | null | undefined)?.dominant_color ?? null
    setDominantColor(stored)
  }, [trip.id, coverStorageKey])

  // One-time extraction when this cover has no `dominant_color` yet (e.g. new image). If the DB
  // already has a value, we never run canvas work on repeat visits — only when `storage_key` changes
  // does the seed effect clear it and this can run again.
  useEffect(() => {
    if (!coverUrl) {
      setDominantColor(null)
      return
    }

    if (persistedCoverDominant) {
      return
    }

    const img = new Image()
    img.crossOrigin = "Anonymous"
    img.src = coverUrl

    img.onload = () => {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      if (!ctx) return

      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)

      try {
        const y0 = Math.floor(canvas.height * 0.65)
        const regionHeight = canvas.height - y0
        const imageData = ctx.getImageData(0, y0, canvas.width, regionHeight)
        const raw = averageRgbFromImageDataSampled(imageData, 10)
        const extracted = rgbToHex(raw.r, raw.g, raw.b)
        setDominantColor(extracted)
        void updateTripCoverDominantColor(trip.id, extracted).catch(() => {})
      } catch (e) {
        console.error("[trip-overview] dominant color extraction failed, keeping DB value", e)
      }
    }

    img.onerror = () => {
      // Do not set null — keep DB-seeded dominant_color so the gradient shows immediately with no delay
    }
  }, [coverUrl, trip.id, coverStorageKey, persistedCoverDominant])

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Fixed background image at the top - show for images and solid colors, but not gradients */}
      {(!isGradient || coverUrl) && (
        <>
          <div
            ref={heroShellRef}
            className="fixed top-0 left-0 w-full h-[45vh] z-[1]"
            style={{
              background: coverUrl ? (tripAccent ?? 'var(--color-background)') : (isGradient ? 'transparent' : backgroundColor),
            }}
          >
            {coverUrl ? (
              <CoverImageWithBlur
                src={coverUrl}
                alt={trip.destination || "Trip destination"}
                blurHash={(trip.cover_photo as { blur_hash?: string | null } | null | undefined)?.blur_hash ?? undefined}
                className="absolute inset-0 w-full h-full"
                imgStyle={{
                  // Fade photo out entirely by ~86% height so the last slice of the hero is only
                  // tripAccent (matches the block below). No residual bitmap at the 45vh edge.
                  maskImage:
                    'linear-gradient(to bottom, black 0%, black 30%, rgba(0,0,0,0.9) 44%, rgba(0,0,0,0.42) 68%, rgba(0,0,0,0.1) 82%, transparent 86%, transparent 100%)',
                  WebkitMaskImage:
                    'linear-gradient(to bottom, black 0%, black 30%, rgba(0,0,0,0.9) 44%, rgba(0,0,0,0.42) 68%, rgba(0,0,0,0.1) 82%, transparent 86%, transparent 100%)',
                }}
              />
            ) : null}
            {/* Dark overlay for text readability — must fade to transparent at the bottom so the
                last row of pixels matches the solid tripAccent block below (no seam at 45vh). */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  'linear-gradient(to bottom, rgba(0,0,0,0.34) 0%, rgba(0,0,0,0.14) 52%, rgba(0,0,0,0.06) 72%, transparent 100%)',
              }}
            />
          </div>

          {/* Fill below hero: same color as hero backing. Slight overlap upward avoids a 1px GPU seam between fixed layers. */}
          {!isGradient && (coverUrl ? tripAccent : backgroundColor !== 'transparent') && (
            <div
              className="fixed left-0 w-full z-[1]"
              style={{
                top: 'calc(45vh - 1px)',
                bottom: 0,
                background: coverUrl ? (tripAccent ?? 'var(--color-background)') : backgroundColor,
              }}
              aria-hidden
            />
          )}

          {/* Dark frosted band: blurs and dims the junction so the transition does not rely on a perfect accent match. */}
          {coverUrl && !isGradient && (
            <div
              className="fixed left-0 right-0 pointer-events-none z-[2]"
              style={{
                top: 'calc(45vh - 7rem)',
                height: '9rem',
                background:
                  'linear-gradient(to bottom, transparent 0%, rgba(14, 11, 16, 0.22) 35%, rgba(14, 11, 16, 0.55) 100%)',
                backdropFilter: 'blur(18px)',
                WebkitBackdropFilter: 'blur(18px)',
                maskImage: 'linear-gradient(to bottom, transparent 0%, black 28%, black 100%)',
                WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 28%, black 100%)',
              }}
              aria-hidden
            />
          )}

          {/* Accent scroll overlay: same height animation as before; gradient is to-bottom (transparent → solid above hero bottom → solid to viewport bottom). */}
          {tripAccent && accentScrollOverlayBackground && (
            <div
              className="fixed left-0 w-full pointer-events-none z-[3]"
              style={{
                bottom: 0,
                height: `calc(90vh + ${smoothScrollY * 1.5}px)`,
                background: accentScrollOverlayBackground,
                willChange: 'height',
              }}
            />
          )}
        </>
      )}

      {/* Sticky header with collapsing title */}
      <div className="fixed top-0 left-0 right-0 z-30">
        {/* Header background - fades in when scrolling */}
        <motion.div
          className="absolute inset-0 backdrop-blur-xl"
          style={{
            background: tripAccent ? `${tripAccent}f0` : 'rgba(14, 11, 16, 0.9)',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: headerBackdropOpacity }}
          transition={{ duration: 0 }}
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
              className="min-w-[200px] bg-popover text-popover-foreground backdrop-blur-xl border border-border rounded-xl p-2 shadow-2xl"
              style={{
                boxShadow: "0 8px 32px -8px rgba(0, 0, 0, 0.8)",
              }}
            >
              {onShare && (
                <DropdownMenuItem
                  onClick={onShare}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors hover:bg-accent focus:bg-accent dark:hover:bg-[#ff7670]/20 dark:focus:bg-[#ff7670]/20"
                >
                  <Share2 className="w-4 h-4" />
                  <span className="text-sm font-medium">{t('trip_overview.menu_share_trip')}</span>
                </DropdownMenuItem>
              )}
              {onInviteByEmail && (
                <DropdownMenuItem
                  onClick={onInviteByEmail}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors hover:bg-accent focus:bg-accent dark:hover:bg-[#ff7670]/20 dark:focus:bg-[#ff7670]/20"
                >
                  <Mail className="w-4 h-4" />
                  <span className="text-sm font-medium">{t('trip_overview.menu_invite_email')}</span>
                </DropdownMenuItem>
              )}
              {onManageGuests && (
                <DropdownMenuItem
                  onClick={onManageGuests}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors hover:bg-accent focus:bg-accent dark:hover:bg-[#ff7670]/20 dark:focus:bg-[#ff7670]/20"
                >
                  <Users className="w-4 h-4" />
                  <span className="text-sm font-medium">{t('trip_overview.menu_manage_guests')}</span>
                </DropdownMenuItem>
              )}
              {onExportTripPdf && (
                <DropdownMenuItem
                  onClick={() => void onExportTripPdf()}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors hover:bg-accent focus:bg-accent dark:hover:bg-[#ff7670]/20 dark:focus:bg-[#ff7670]/20"
                >
                  <FileDown className="w-4 h-4" />
                  <span className="text-sm font-medium">{t("trip_overview.menu_export_pdf")}</span>
                </DropdownMenuItem>
              )}
              {(onEdit || onDelete) && <DropdownMenuSeparator className="bg-border my-2" />}
              {onEdit && (
                <DropdownMenuItem
                  onClick={onEdit}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors hover:bg-accent focus:bg-accent dark:hover:bg-[#ff7670]/20 dark:focus:bg-[#ff7670]/20"
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
              opacity: showCollapsedHeaderChrome ? 1 : 0,
              scale: showCollapsedHeaderChrome ? 1 : 0.8,
              y: showCollapsedHeaderChrome ? 0 : 20
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
          background: isGradient && !coverUrl && trip.color
            ? trip.color
            : 'transparent'
        }}
        onScroll={handleScroll}
      >
        <motion.div
          className="relative z-10 px-6 pt-60 pb-2 text-center"
          initial="hidden"
          animate={showCollapsedHeaderChrome ? "hidden" : "visible"}
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
            className="text-5xl font-bold text-white mb-2 drop-shadow-lg"
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 },
            }}
          >
            {trip.destination || trip.title || t('trips.untitled_trip')}
          </motion.h1>
          <motion.p
            className="text-white/90 text-base mb-0.5 drop-shadow-md"
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
          className="relative z-10 w-full pt-2 pb-4 px-6"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, type: "spring", stiffness: 320, damping: 28 }}
        >
          <div
            className="grid w-full grid-cols-4 gap-x-3 sm:gap-x-5"
            role="group"
            aria-label={t("trip_overview.quick_actions_group_a11y")}
          >
            <div className="flex min-w-0 flex-col items-center gap-2 text-center">
              <motion.button
                type="button"
                onClick={() => onNavigate("activity")}
                className={TRIP_OVERVIEW_QUICK_ACTION_CORAL_CLASS}
                aria-label={t("trip_overview.quick_add_a11y")}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 400, damping: 22 }}
              >
                <Plus className="size-7 sm:size-8" strokeWidth={1.65} aria-hidden />
              </motion.button>
              <span className="w-full px-0.5 text-[11px] font-medium leading-tight text-white sm:text-xs">
                {t("trip_overview.quick_add")}
              </span>
            </div>
            <div className="flex min-w-0 flex-col items-center gap-2 text-center">
              <motion.button
                type="button"
                onClick={() => onNavigate("flight")}
                className={TRIP_OVERVIEW_QUICK_ACTION_GLASS_CLASS}
                aria-label={t("trip_overview.quick_flight_a11y")}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 400, damping: 22 }}
              >
                <Plane className="size-7 sm:size-8" strokeWidth={1.65} aria-hidden />
              </motion.button>
              <span className="w-full px-0.5 text-[11px] font-medium leading-tight text-white sm:text-xs">
                {t("trip_overview.quick_flight")}
              </span>
            </div>
            <div className="flex min-w-0 flex-col items-center gap-2 text-center">
              <motion.button
                type="button"
                onClick={() => onNavigate("lodging")}
                className={TRIP_OVERVIEW_QUICK_ACTION_GLASS_CLASS}
                aria-label={t("trip_overview.quick_lodging_a11y")}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 400, damping: 22 }}
              >
                <Bed className="size-7 sm:size-8" strokeWidth={1.65} aria-hidden />
              </motion.button>
              <span className="w-full px-0.5 text-[11px] font-medium leading-tight text-white sm:text-xs">
                {t("trip_overview.quick_lodging")}
              </span>
            </div>
            <div className="flex min-w-0 flex-col items-center gap-2 text-center">
              <motion.button
                type="button"
                onClick={() => onNavigate("place")}
                className={TRIP_OVERVIEW_QUICK_ACTION_GLASS_CLASS}
                aria-label={t("trip_overview.quick_place_a11y")}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 400, damping: 22 }}
              >
                <MapPin className="size-7 sm:size-8" strokeWidth={1.65} aria-hidden />
              </motion.button>
              <span className="w-full px-0.5 text-[11px] font-medium leading-tight text-white sm:text-xs">
                {t("trip_overview.quick_place")}
              </span>
            </div>
          </div>
        </motion.div>

        <div className="relative z-10 px-6 pb-7 space-y-3">
          <AnimatePresence>
            {scheduleAttention && scheduleAttention.itemCount > 0 ? (
              <motion.div
                key="trip-overview-schedule-attention"
                className="overflow-hidden"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{
                  height: { duration: 0.32, ease: [0.4, 0, 0.2, 1] },
                  opacity: { duration: 0.22, ease: "easeOut" },
                }}
              >
                <Card className={`rounded-2xl ${TRIP_OVERVIEW_CARD_PADDING} bg-card text-card-foreground border-2 border-[#ff7670]/35`}>
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-[#ff7670]/15 flex items-center justify-center shrink-0 dark:bg-white/10">
                        <AlertTriangle className="w-5 h-5 text-[#ff7670]" aria-hidden />
                      </div>
                      <div className="min-w-0">
                        <h2 className="text-base font-semibold text-foreground">
                          {t("trip_overview.schedule_attention_title")}
                        </h2>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {t("trip_overview.schedule_attention_breakdown", {
                            stops: scheduleAttention.stopCount,
                            activities: scheduleAttention.activityCount,
                          })}
                        </p>
                      </div>
                    </div>
                    <Badge
                      className="text-xs font-bold px-2 py-1 rounded border-0 shrink-0"
                      style={{ background: "#ff7670", color: "white" }}
                    >
                      {scheduleAttention.itemCount}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground text-sm mb-3">
                    {t("trip_overview.schedule_attention_body")}
                  </p>
                  <button
                    type="button"
                    className="w-full font-semibold text-sm"
                    style={{ color: "#ff7670" }}
                    onClick={() => scheduleAttention.onReview()}
                  >
                    {t("trip_overview.schedule_attention_cta")}
                  </button>
                </Card>
              </motion.div>
            ) : null}
          </AnimatePresence>

          {/* Itinerary Card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <Card className={`border-border dark:border-white/[0.08] rounded-2xl ${TRIP_OVERVIEW_CARD_PADDING} bg-card text-card-foreground shadow-none`}>
              <div className="flex items-center justify-between gap-3 mb-2.5">
                <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: "#ff7670" }}
                >
                  <Calendar className="w-5 h-5 text-primary-foreground" />
                </div>
                  <div className="flex flex-col">
                    <span className="text-xs uppercase tracking-wide text-muted-foreground">
                      {t('trip_overview.route_title')}
                    </span>
                    <span className="text-sm font-semibold text-foreground">
                      {trip.destination || trip.title || t('trips.untitled_trip')}
                    </span>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {hasRoute ? todayLabel : startDate}
                </span>
              </div>

              {loadingRoute && (
                <div className="relative mb-3">
                  <div
                    className="pointer-events-none absolute bottom-2 left-[10px] top-2 w-px -translate-x-1/2 bg-white/10"
                    aria-hidden
                  />
                  {[0, 1, 2].map((idx) => (
                    <div
                      key={idx}
                      className="relative flex min-h-[2.75rem] items-center gap-3 py-1 pl-7 pr-1 sm:pr-2"
                    >
                      <div
                        className="absolute left-[10px] top-1/2 z-[1] h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-muted ring-2 ring-card animate-pulse dark:ring-[#17131a]"
                        aria-hidden
                      />
                      <div className="h-9 flex-1 rounded-lg bg-muted/80 animate-pulse" />
                    </div>
                  ))}
                </div>
              )}

              {!loadingRoute && hasRoute && (
                <div className="mb-3">
                  <div className="relative">
                    {/* One soft spine like Tripsy — not per-row flex segments */}
                    <div
                      className="pointer-events-none absolute bottom-1 left-[10px] top-1 w-px -translate-x-1/2 bg-white/[0.1] dark:bg-white/[0.12]"
                      aria-hidden
                    />
                    {itineraryOverviewVisible.map((location, index) => {
                      const dateCompact = getLocationDateOverviewCompact(location)
                      const stopDotColor =
                        location.marker_color != null && isSolidRouteColor(location.marker_color)
                          ? location.marker_color
                          : getStablePaletteColorForLocationId(location.id)
                      return (
                        <div
                          key={location.id}
                          className="group relative flex min-h-[2.75rem] cursor-pointer items-center gap-3 py-1 pl-7 pr-1 first:pt-0 last:pb-0 sm:pr-2"
                          onClick={() => onOpenLocation?.(location.id)}
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault()
                              onOpenLocation?.(location.id)
                            }
                          }}
                        >
                          <div
                            className="absolute left-[10px] top-1/2 z-[1] h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-card dark:ring-[#17131a]"
                            style={{ backgroundColor: stopDotColor }}
                            aria-hidden
                          />
                          <div className="flex min-w-0 flex-1 items-center justify-between gap-2 rounded-lg px-1 py-1.5 transition-colors group-hover:bg-muted/30 dark:group-hover:bg-white/[0.04] sm:gap-3 sm:px-2">
                            <p className="min-w-0 truncate text-base font-semibold leading-tight text-foreground dark:text-white">
                              {location.location_name || t("trips.untitled_trip")}
                            </p>
                            <div className="flex shrink-0 items-center justify-end gap-2 text-right">
                              {renderLocationWeather(location)}
                              {dateCompact}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <div className="mt-3 flex flex-col gap-2 border-t border-border/40 pt-3 dark:border-white/[0.08]">
                    {itineraryOverviewMoreCount > 0 ? (
                      <p className="text-xs text-muted-foreground dark:text-white/55">
                        {t("trip_overview.itinerary_more_stops", {
                          count: itineraryOverviewMoreCount,
                        })}
                      </p>
                    ) : null}
                    <button
                      type="button"
                      className="w-fit text-left text-xs font-semibold uppercase tracking-wider text-[#ff7670] transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff7670]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-card"
                      onClick={(e) => {
                        e.stopPropagation()
                        onNavigate("timeline")
                      }}
                    >
                      {t("trip_overview.view_all_days")}
                    </button>
                  </div>
                </div>
              )}

              {!routeLoading && !hasRoute && (
                <div className="flex items-center justify-between gap-3 border border-dashed border-border rounded-2xl px-3.5 py-2.5 mb-2.5 bg-muted/40 dark:border-white/15 dark:bg-white/[0.02]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center dark:bg-white/10">
                      <Plus className="w-5 h-5 text-foreground dark:text-white" />
                    </div>
                    <div>
                      <p className="text-foreground font-semibold text-sm">{t('trip_overview.route_empty_title')}</p>
                      <p className="text-xs text-muted-foreground">{t('trip_overview.route_empty')}</p>
                    </div>
                  </div>
                  <button className="text-xs font-semibold uppercase tracking-wide text-[#ff7670]">
                    {t('trip_overview.route_add_stop')}
                  </button>
              </div>
              )}

            </Card>
          </motion.div>

          {/* Route Map */}
          {!loadingRoute && hasRoute && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.52 }}>
              <div onClick={() => onNavigate("map")}>
                <Card className="relative overflow-hidden border-white/[0.08] rounded-2xl min-h-[220px] h-[min(42vw,320px)] sm:h-64 cursor-pointer group shadow-none bg-[#0e0b10]">
                  {/* Map: avoid CSS scale on hover — it blurs the WebGL canvas; use overlays only. */}
                  <div className="absolute inset-0 z-0 pointer-events-none transition-opacity duration-500 group-hover:opacity-95">
                    <MapView
                      waypoints={tripLocationsToWaypoints(routeLocations)}
                      routeLineGeo={routeGeo}
                      fitToRoute
                      fitPadding={40}
                      interactive={false}
                    />
                    {/* Very dark gradient overlays to ensure absolute text legibility while letting the map peek through */}
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0e0b10] via-[#0e0b10]/60 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-b from-[#0e0b10]/80 via-transparent to-transparent" />
                  </div>

                  {/* Content on top of map */}
                  <div className="relative z-10 h-full flex flex-col justify-center items-center p-4 text-center sm:p-5">
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#ff7670] drop-shadow-md mb-1">
                        {t("trip_overview.route_map_title")}
                      </span>
                      <span className="text-3xl font-bold text-white drop-shadow-xl mb-3 sm:mb-4">
                        {trip.destination || trip.title || t("trips.untitled_trip")}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-white/90 group-hover:text-white transition-colors bg-white/10 backdrop-blur-md px-5 py-2 rounded-full border border-white/20 shadow-lg">
                      <MapIcon className="w-4 h-4" />
                      <span className="text-[11px] font-bold uppercase tracking-widest">Expand Map</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Card>
              </div>
            </motion.div>
          )}

          {/* Weather Widget */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}>
            <div onClick={() => onNavigate("weather")}>
              {(() => {
                const weatherLocationLabel =
                  derivedLocations[0]?.location_name || trip.destination || trip.title || "—"
                const accent = tripAccent ?? '#1a1a2e'

                if (weatherLoading) {
                  return (
                    <Card
                      className="relative overflow-hidden border-0 rounded-3xl shadow-xl"
                      style={{
                        background: `linear-gradient(135deg, ${accent} 0%, ${accent}dd 100%)`,
                      }}
                    >
                      <div className="absolute top-0 left-0 right-0 h-1/2 bg-linear-to-b from-white/10 to-transparent pointer-events-none" />
                      <div className="relative z-10 flex items-center justify-between gap-5 p-5 sm:p-6">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 text-white/90 text-sm font-medium mb-2 truncate">
                            <span className="inline-block w-2 h-2 rounded-full bg-white/70 shrink-0" />
                            <span className="truncate">{weatherLocationLabel}</span>
                          </div>
                          <div className="h-10 w-28 rounded-2xl bg-white/10 animate-pulse" />
                          <div className="h-4 w-44 rounded-xl bg-white/5 animate-pulse mt-3" />
                        </div>
                        <div className="w-20 h-20 rounded-3xl bg-white/10 border border-white/10 animate-pulse shrink-0" />
                      </div>
                    </Card>
                  )
                }

                if (primaryWeather?.current) {
                  return (
                    <WeatherWidget
                      color={accent}
                      weather={{
                        ...primaryWeather,
                        location: weatherLocationLabel,
                      }}
                      updatedAt={weatherFetchedAt}
                      showMeta
                    />
                  )
                }

                return (
                  <WeatherUnavailableSummaryCard
                    color={accent}
                    locationLabel={weatherLocationLabel}
                    errorMessage={weatherError}
                    onRetry={
                      onRefetchWeather
                        ? () =>
                            onRefetchWeather().catch((e: unknown) =>
                              toast.error("Retry failed", {
                                description: e instanceof Error ? e.message : String(e),
                              })
                            )
                        : undefined
                    }
                  />
                )
              })()}
            </div>
          </motion.div>

          {/* Trip gallery */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.56 }}>
            <div onClick={() => onNavigate("gallery")}>
              <Card
                className={`relative cursor-pointer overflow-hidden border-border dark:border-white/[0.08] rounded-2xl ${TRIP_OVERVIEW_CARD_PADDING} bg-card text-card-foreground transition-colors hover:bg-accent/5 dark:hover:bg-white/[0.04]`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 dark:bg-white/10">
                      <Images className="h-5 w-5 text-primary dark:text-white" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-base font-semibold text-foreground">
                        {t("trip_overview.gallery_title", {
                          defaultValue: "Trip gallery",
                        })}
                      </h2>
                      <p className="text-muted-foreground mt-0.5 text-sm">
                        {t("trip_gallery.overview_hint", {
                          defaultValue: "Upload trip photos, zoom full screen — like notes, for pictures.",
                        })}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground" />
                </div>
              </Card>
            </div>
          </motion.div>

          {/* Trip notes — full-page editor */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.58 }}>
            <div onClick={() => onNavigate("notes")}>
              <Card
                className={`relative cursor-pointer overflow-hidden border-border dark:border-white/[0.08] rounded-2xl ${TRIP_OVERVIEW_CARD_PADDING} bg-card text-card-foreground transition-colors hover:bg-accent/5 dark:hover:bg-white/[0.04]`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 dark:bg-white/10">
                      <NotebookPen className="h-5 w-5 text-primary dark:text-white" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-base font-semibold text-foreground">
                        {t("trip_overview.notes_title")}
                      </h2>
                      <p className="text-muted-foreground mt-0.5 text-sm">
                        {t("trip_notes.overview_hint", {
                          defaultValue: "Plans, checklists, links — open the full editor.",
                        })}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground" />
                </div>
              </Card>
            </div>
          </motion.div>

          {/* Trip budget — full page like notes */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.59 }}>
            <div onClick={() => onNavigate("budget")}>
              <Card
                className={`relative cursor-pointer overflow-hidden border-border dark:border-white/[0.08] rounded-2xl ${TRIP_OVERVIEW_CARD_PADDING} bg-card text-card-foreground transition-colors hover:bg-accent/5 dark:hover:bg-white/[0.04]`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 dark:bg-white/10">
                      <Wallet className="h-5 w-5 text-primary dark:text-white" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-base font-semibold text-foreground">
                        {t("trip_overview.budget_title", { defaultValue: "Budget" })}
                      </h2>
                      <p className="text-muted-foreground mt-0.5 text-sm">
                        {t("trip_budget.overview_hint", {
                          defaultValue: "Cap, expenses, and stops — open the full budget.",
                        })}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground" />
                </div>
              </Card>
            </div>
          </motion.div>

          {/* Documents Card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
            <Card
              className={`border-border dark:border-white/[0.08] rounded-2xl ${TRIP_OVERVIEW_CARD_PADDING} bg-card text-card-foreground`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center dark:bg-white/10">
                    <FileText className="w-5 h-5 text-primary dark:text-white" />
                  </div>
                  <h2 className="text-base font-semibold text-foreground">{t('trip_overview.documents')}</h2>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    className="text-xs font-bold px-2 py-1 rounded border-0"
                    style={{ background: "#ff7670", color: "white" }}
                  >
                    {t('trip_overview.pro_badge')}
                  </Badge>
                  <Lock className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>

              <div className="flex justify-center gap-5 mb-3 py-3">
                <Mail className="w-6 h-6 text-muted-foreground" />
                <ImageIcon className="w-6 h-6 text-muted-foreground" />
                <FileType className="w-6 h-6 text-muted-foreground" />
                <LinkIcon className="w-6 h-6 text-muted-foreground" />
              </div>

              <p className="text-muted-foreground text-sm text-center mb-3">
                {t('trip_overview.add_documents_description')}
              </p>

              <button className="w-full font-semibold text-sm" style={{ color: "#ff7670" }}>
                {t('trip_overview.add_document')}
              </button>
            </Card>
          </motion.div>

          {hasCustomizeActions && (
            <motion.div
              className="flex justify-center pt-3 pb-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              <Popover open={customizePopoverOpen} onOpenChange={setCustomizePopoverOpen}>
                <PopoverTrigger asChild>
                  <motion.button
                    type="button"
                    className="flex items-center gap-2 overflow-hidden rounded-full border border-border bg-card/90 px-5 py-2.5 text-foreground shadow-sm backdrop-blur-md dark:border-white/20 dark:bg-white/10 dark:text-white"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Settings className="h-5 w-5 shrink-0" />
                    <span className="font-semibold">{t("trip_overview.customize")}</span>
                  </motion.button>
                </PopoverTrigger>
                <PopoverContent
                  align="center"
                  side="top"
                  sideOffset={8}
                  className="w-max max-w-[min(100vw-1.5rem,13.5rem)] rounded-lg border border-border bg-popover p-1 shadow-lg"
                >
                  <div className="flex flex-col">
                    {onEditName ? (
                      <button
                        type="button"
                        className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm font-medium text-popover-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:hover:bg-[#ff7670]/20"
                        onClick={() => {
                          setCustomizePopoverOpen(false)
                          onEditName()
                        }}
                      >
                        <Pencil className="h-4 w-4 shrink-0" />
                        {t("trip_overview.menu_edit_name")}
                      </button>
                    ) : null}
                    {onChangeDates ? (
                      <button
                        type="button"
                        className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm font-medium text-popover-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:hover:bg-[#ff7670]/20"
                        onClick={() => {
                          setCustomizePopoverOpen(false)
                          setShowDatePicker(true)
                        }}
                      >
                        <Calendar className="h-4 w-4 shrink-0" />
                        {t("trip_overview.menu_change_dates")}
                      </button>
                    ) : null}
                    {onChangeBackground ? (
                      <button
                        type="button"
                        className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm font-medium text-popover-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:hover:bg-[#ff7670]/20"
                        onClick={() => {
                          setCustomizePopoverOpen(false)
                          setShowBackgroundPicker(true)
                        }}
                      >
                        <ImageIcon className="h-4 w-4 shrink-0" />
                        {t("trip_overview.menu_change_background")}
                      </button>
                    ) : null}
                  </div>
                </PopoverContent>
              </Popover>
            </motion.div>
          )}
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
            className="bg-card text-card-foreground border border-border rounded-2xl p-6 mx-6 max-w-md w-full shadow-xl dark:bg-[#0e0b10] dark:border-white/10"
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
                <h3 className="text-lg font-semibold text-foreground">{t('trip_overview.delete_trip')}</h3>
                <p className="text-sm text-muted-foreground">{t('trip_overview.delete_confirmation')}</p>
              </div>
            </div>
            <p className="text-muted-foreground mb-6">
              {t('trip_overview.delete_message', { tripName: trip.destination || trip.title })}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 rounded-lg bg-muted text-foreground font-medium hover:bg-muted/80 transition-colors dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
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
          onSelect={async (dateRange) => {
            try {
              await Promise.resolve(onChangeDates(dateRange));
            } catch (err) {
              console.error("TripOverview: onChangeDates failed", err);
              toast.error(t("common.error_occurred", { defaultValue: "An error occurred" }), {
                description: err instanceof Error ? err.message : String(err),
              });
            } finally {
              setShowDatePicker(false);
            }
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
          timelineContext={datePickerTimelineContext}
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
          onSelectUpload={
            onChangeBackgroundUpload
              ? (payload) => {
                  onChangeBackgroundUpload(payload)
                  setShowBackgroundPicker(false)
                }
              : undefined
          }
          onSelectColor={(color) => {
            onChangeBackgroundColor?.(color)
            setShowBackgroundPicker(false)
          }}
          defaultSearchQuery={trip.destination || trip.title || undefined}
        />
      )}
    </div>
  )
}

