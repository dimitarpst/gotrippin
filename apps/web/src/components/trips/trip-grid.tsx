"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Calendar, MapPin } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Trip } from "@gotrippin/core"
import { tripDisplayTitle } from "@/lib/trip-display"
import { resolveTripCoverUrl } from "@/lib/r2-public"
import { CoverImageWithBlur } from "@/components/ui/cover-image-with-blur"

interface TripWithCalculations extends Trip {
  startDate: string
  endDate: string
  daysUntil: number
  duration: number
}

interface TripGridProps {
  trips: TripWithCalculations[]
  /** Hide current user from facepile — show only other people on the trip. */
  viewerUserId?: string
  activeFilter: "all" | "upcoming" | "past"
  onSelectTrip: (shareCode: string) => void
}

const FACEPILE_MAX = 4

type FacepileEntry = NonNullable<Trip["member_facepile"]>[number]

function TripMemberFacepile({ entries }: { entries: readonly FacepileEntry[] }) {
  if (entries.length === 0) {
    return null
  }
  const overflow = entries.length > FACEPILE_MAX ? entries.length - FACEPILE_MAX : 0
  const tail =
    entries.length <= FACEPILE_MAX ? entries : entries.slice(entries.length - FACEPILE_MAX)

  return (
    <div className="flex shrink-0 items-center pl-1">
      <div className="flex items-center -space-x-2">
        {overflow > 0 ? (
          <div
            className="relative z-[1] flex h-9 min-w-[2.25rem] items-center justify-center rounded-full border-2 border-black/35 bg-black/55 px-1 text-[10px] font-semibold tabular-nums text-white ring-1 ring-white/25"
            title={`+${overflow}`}
          >
            +{overflow}
          </div>
        ) : null}
        {tail.map((e, i) => {
          const initial = e.label.trim().length > 0 ? e.label.trim().charAt(0).toUpperCase() : "?"
          const url = e.avatar_url && e.avatar_url.trim().length > 0 ? e.avatar_url.trim() : null
          return url ? (
            <img
              key={e.user_id}
              src={url}
              alt=""
              title={e.label}
              referrerPolicy="no-referrer"
              className="relative h-9 w-9 rounded-full border-2 border-black/35 object-cover ring-1 ring-white/25"
              style={{ zIndex: 2 + i }}
            />
          ) : (
            <div
              key={e.user_id}
              title={e.label}
              className="relative flex h-9 w-9 items-center justify-center rounded-full border-2 border-black/35 bg-black/50 text-xs font-semibold text-white ring-1 ring-white/25"
              style={{ zIndex: 2 + i }}
            >
              {initial}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function TripGrid({ trips, viewerUserId, activeFilter, onSelectTrip }: TripGridProps) {
  return (
    <motion.div
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-0 pb-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, type: "spring", damping: 20 }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={activeFilter}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.2 }}
        >
          {trips.map((trip, index) => (
            <motion.div
              key={trip.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{
                type: "spring",
                stiffness: 350,
                damping: 25,
                delay: index * 0.05,
              }}
              layout
              whileHover={{ y: -8 }}
            >
              <Card
                className="border-white/[0.08] rounded-2xl overflow-hidden shadow-lg cursor-pointer transition-all duration-300 bg-[var(--surface)] backdrop-blur-xl group hover:border-white/[0.15] hover:shadow-2xl hover:shadow-[#ff7670]/10"
                onClick={() => onSelectTrip(trip.share_code)}
              >
                {(() => {
                  const coverUrl = resolveTripCoverUrl(trip)
                  const rawFacepile = trip.member_facepile ?? []
                  const facepile =
                    viewerUserId !== undefined && viewerUserId !== ""
                      ? rawFacepile.filter((e) => e.user_id !== viewerUserId)
                      : rawFacepile
                  return (
                    <div
                      className="relative h-48 overflow-hidden"
                      style={{ background: coverUrl ? "transparent" : trip.color || "#ff7670" }}
                    >
                      {coverUrl ? (
                        <CoverImageWithBlur
                          src={coverUrl}
                          alt={tripDisplayTitle(trip) ?? "Trip"}
                          blurHash={trip.cover_photo?.blur_hash ?? undefined}
                          className="absolute inset-0 w-full h-full"
                          hoverScale
                        />
                      ) : null}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-100 transition-all duration-300 group-hover:from-black/90" />
                      {trip.daysUntil > 0 ? (
                        <motion.div
                          className="absolute top-3 right-3"
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          transition={{ type: "spring", stiffness: 400, damping: 17 }}
                        >
                          <Badge
                            className="text-white border-0 text-xs font-semibold shadow-lg"
                            style={{ background: "#ff7670" }}
                          >
                            {trip.daysUntil} days
                          </Badge>
                        </motion.div>
                      ) : null}
                      <motion.div
                        className="absolute bottom-0 left-0 right-0 flex min-w-0 items-end justify-between gap-3 p-4"
                        initial={{ y: 0 }}
                        whileHover={{ y: -4 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      >
                        <div className="min-w-0 flex-1 pr-1">
                          <h3 className="line-clamp-2 min-w-0 text-xl font-bold leading-tight text-white [overflow-wrap:anywhere] break-words transition-colors duration-200 group-hover:text-[#ff7670]">
                            {tripDisplayTitle(trip) ?? "Untitled Trip"}
                          </h3>
                          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-white/80 text-xs">
                            <div className="flex min-w-0 items-center gap-1">
                              <Calendar className="w-3 h-3 shrink-0" aria-hidden />
                              <span className="truncate">
                                {trip.startDate} → {trip.endDate}
                              </span>
                            </div>
                            {trip.duration > 0 ? (
                              <div className="flex items-center gap-1">
                                <MapPin className="w-3 h-3 shrink-0" aria-hidden />
                                <span>{trip.duration} days</span>
                              </div>
                            ) : null}
                          </div>
                        </div>
                        <TripMemberFacepile entries={facepile} />
                      </motion.div>
                    </div>
                  )
                })()}
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  )
}
